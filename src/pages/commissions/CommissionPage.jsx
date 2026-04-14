import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/ui/Badge'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatRupiah, formatDate } from '../../lib/utils'

const statusVariants = { pending: 'warning', approved: 'info', paid: 'success' }
const statusLabels = { pending: 'Pending', approved: 'Disetujui', paid: 'Dibayar' }

export default function CommissionPage() {
  const { profile, role } = useAuthStore()
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    setLoading(true)
    let query = supabase
      .from('commissions')
      .select(`
        *,
        marketing:profiles!commissions_marketing_id_fkey(full_name),
        approved_by_profile:profiles!commissions_approved_by_fkey(full_name),
        booking:bookings(buyer_name, unit:units(nomor, tipe))
      `)
      .order('created_at', { ascending: false })

    if (role === 'marketing') {
      query = query.eq('marketing_id', profile?.id)
    }

    const { data } = await query
    setCommissions(data || [])
    setLoading(false)
  }

  const handleApprove = async (id) => {
    await supabase
      .from('commissions')
      .update({ status: 'approved', approved_by: profile?.id, approved_at: new Date().toISOString() })
      .eq('id', id)
    fetchCommissions()
  }

  const handlePaid = async (id) => {
    await supabase
      .from('commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
    fetchCommissions()
  }

  const total = commissions.reduce((s, c) => s + (c.amount || 0), 0)
  const paid = commissions.filter((c) => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0)
  const pending = commissions.filter((c) => c.status !== 'paid').reduce((s, c) => s + (c.amount || 0), 0)

  return (
    <PageWrapper
      title={role === 'marketing' ? 'Komisi Saya' : 'Komisi Tim'}
      subtitle="Rekap komisi penjualan"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Komisi', value: formatRupiah(total), color: 'text-gray-900' },
          { label: 'Sudah Dibayar', value: formatRupiah(paid), color: 'text-green-600' },
          { label: 'Belum Dibayar', value: formatRupiah(pending), color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {role !== 'marketing' && <th className="text-left px-4 py-3 font-medium text-gray-600">Sales</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Booking</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Komisi</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  {role === 'manager' && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">Belum ada data komisi</td>
                  </tr>
                ) : commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    {role !== 'marketing' && (
                      <td className="px-4 py-3 text-gray-700">{c.marketing?.full_name || '-'}</td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.booking?.buyer_name || '-'}</p>
                      <p className="text-xs text-gray-400">Unit {c.booking?.unit?.nomor || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(c.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.paid_at ? formatDate(c.paid_at) : c.approved_at ? formatDate(c.approved_at) : formatDate(c.created_at)}
                    </td>
                    {role === 'manager' && (
                      <td className="px-4 py-3 text-right">
                        {c.status === 'pending' && (
                          <button onClick={() => handleApprove(c.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium mr-3">Setujui</button>
                        )}
                        {c.status === 'approved' && (
                          <button onClick={() => handlePaid(c.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">Bayar</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
