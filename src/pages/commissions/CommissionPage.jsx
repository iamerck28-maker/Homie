import { useState, useEffect } from 'react'
import { Plus, DollarSign, CheckCircle, Clock } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatRupiah, formatDate } from '../../lib/utils'

const statusVariants = { pending: 'warning', approved: 'info', paid: 'success' }
const statusLabels = { pending: 'Pending', approved: 'Disetujui', paid: 'Dibayar' }

export default function CommissionPage() {
  const { profile, role, activeProject } = useAuthStore()
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Data untuk form
  const [bookings, setBookings] = useState([])
  const [marketingUsers, setMarketingUsers] = useState([])

  const [form, setForm] = useState({
    booking_id: '',
    marketing_id: '',
    percentage: '',
    amount: '',
    notes: '',
  })
  const [usePercentage, setUsePercentage] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchCommissions(mounted)
    if (role === 'manager') {
      fetchFormData()
    }
    return () => { mounted = false }
  }, [activeProject?.id])

  const fetchCommissions = async (mounted = true) => {
    setLoading(true)
    let query = supabase
      .from('commissions')
      .select(`
        *,
        marketing:profiles!commissions_marketing_id_fkey(full_name),
        approved_by_profile:profiles!commissions_approved_by_fkey(full_name),
        booking:bookings(buyer_name, booking_date, project_id, unit:units(nomor, tipe, harga))
      `)
      .order('created_at', { ascending: false })

    if (role === 'marketing') {
      query = query.eq('marketing_id', profile?.id)
    }

    const { data } = await query
    if (mounted) {
      const projectId = activeProject?.id ?? null
      const filtered = projectId
        ? (data || []).filter((c) => c.booking?.project_id === projectId)
        : (data || [])
      setCommissions(filtered)
      setLoading(false)
    }
  }

  const fetchFormData = async () => {
    const [bookingsRes, usersRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, buyer_name, unit:units(nomor, tipe, harga), created_by_profile:profiles!bookings_created_by_fkey(id, full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'marketing')
        .order('full_name'),
    ])
    setBookings(bookingsRes.data || [])
    setMarketingUsers(usersRes.data || [])
  }

  // Hitung amount otomatis dari percentage
  const selectedBooking = bookings.find((b) => b.id === form.booking_id)
  const unitPrice = selectedBooking?.unit?.harga || 0
  const calculatedAmount = usePercentage && form.percentage
    ? Math.round((parseFloat(form.percentage) / 100) * unitPrice)
    : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.booking_id || !form.marketing_id) {
      setFormError('Booking dan sales wajib dipilih')
      return
    }
    if (usePercentage && !form.percentage) {
      setFormError('Persentase wajib diisi')
      return
    }
    if (!usePercentage && !form.amount) {
      setFormError('Nominal komisi wajib diisi')
      return
    }

    setFormLoading(true)
    setFormError('')
    try {
      const amount = usePercentage ? calculatedAmount : parseFloat(form.amount)
      const { error } = await supabase.from('commissions').insert([{
        booking_id: form.booking_id,
        marketing_id: form.marketing_id,
        amount,
        percentage: usePercentage ? parseFloat(form.percentage) : null,
        notes: form.notes || null,
        status: 'pending',
      }])
      if (error) throw error
      setShowModal(false)
      setForm({ booking_id: '', marketing_id: '', percentage: '', amount: '', notes: '' })
      fetchCommissions()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
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
      subtitle="Rekap dan approval komisi penjualan"
      actions={
        role === 'manager' && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Tambah Komisi
          </Button>
        )
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Komisi', value: formatRupiah(total), icon: <DollarSign size={18} />, color: 'text-gray-900', bg: 'bg-gray-50' },
          { label: 'Sudah Dibayar', value: formatRupiah(paid), icon: <CheckCircle size={18} />, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Belum Dibayar', value: formatRupiah(pending), icon: <Clock size={18} />, color: 'text-orange-700', bg: 'bg-orange-50' },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${bg} ${color}`}>{icon}</div>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : commissions.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={48} />}
          title="Belum ada data komisi"
          description={role === 'manager' ? 'Tambah komisi setelah booking closing' : 'Komisi Anda akan muncul di sini'}
          action={role === 'manager' && <Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Tambah Komisi</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {role !== 'marketing' && <th className="text-left px-4 py-3 font-medium text-gray-600">Sales</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Booking</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Harga Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">% Komisi</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Nominal</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  {role === 'manager' && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    {role !== 'marketing' && (
                      <td className="px-4 py-3 font-medium text-gray-700">{c.marketing?.full_name || '-'}</td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.booking?.buyer_name || '-'}</p>
                      <p className="text-xs text-gray-400">Unit {c.booking?.unit?.nomor || '-'} · {c.booking?.unit?.tipe || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(c.booking?.unit?.harga)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {c.percentage ? `${c.percentage}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatRupiah(c.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariants[c.status]}>{statusLabels[c.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.paid_at ? formatDate(c.paid_at) : c.approved_at ? formatDate(c.approved_at) : formatDate(c.created_at)}
                    </td>
                    {role === 'manager' && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {c.status === 'pending' && (
                          <button onClick={() => handleApprove(c.id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            Setujui
                          </button>
                        )}
                        {c.status === 'approved' && (
                          <button onClick={() => handlePaid(c.id)} className="text-xs text-green-600 hover:text-green-700 font-medium">
                            Tandai Dibayar
                          </button>
                        )}
                        {c.status === 'paid' && (
                          <span className="text-xs text-gray-400">Lunas</span>
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

      {/* Modal Tambah Komisi */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError('') }}
        title="Tambah Komisi"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleSubmit} loading={formLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>
          )}

          <Select label="Booking" required value={form.booking_id}
            onChange={(e) => {
              const b = bookings.find((x) => x.id === e.target.value)
              setForm({ ...form, booking_id: e.target.value, marketing_id: b?.created_by_profile?.id || form.marketing_id })
            }}>
            <option value="">Pilih booking...</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyer_name} — Unit {b.unit?.nomor} ({formatRupiah(b.unit?.harga)})
              </option>
            ))}
          </Select>

          <Select label="Sales" required value={form.marketing_id}
            onChange={(e) => setForm({ ...form, marketing_id: e.target.value })}>
            <option value="">Pilih sales...</option>
            {marketingUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </Select>

          {/* Toggle persentase / nominal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hitung Komisi</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
              <button type="button"
                className={`flex-1 py-2 font-medium transition-colors ${usePercentage ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setUsePercentage(true)}>
                Persentase
              </button>
              <button type="button"
                className={`flex-1 py-2 font-medium transition-colors ${!usePercentage ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setUsePercentage(false)}>
                Nominal
              </button>
            </div>
          </div>

          {usePercentage ? (
            <div>
              <Input label="Persentase (%)" type="number" step="0.01" min="0" max="100"
                value={form.percentage}
                onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                placeholder="cth: 2.5" />
              {calculatedAmount > 0 && (
                <p className="text-sm text-primary-600 font-medium mt-1">
                  = {formatRupiah(calculatedAmount)}
                </p>
              )}
            </div>
          ) : (
            <Input label="Nominal Komisi (Rp)" type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="cth: 5000000" />
          )}

          <Textarea label="Catatan" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan tambahan (opsional)" />
        </form>
      </Modal>
    </PageWrapper>
  )
}
