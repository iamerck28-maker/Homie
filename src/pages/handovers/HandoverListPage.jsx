import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Home } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate } from '../../lib/utils'
import { DEFAULT_CHECKLIST } from '../../lib/bast'
import { useBookings } from '../../hooks/useBookings'

const STATUS_LABELS = { scheduled: 'Terjadwal', rescheduled: 'Dijadwal Ulang', done: 'Selesai' }
const STATUS_VARIANTS = { scheduled: 'warning', rescheduled: 'info', done: 'success' }

export default function HandoverListPage() {
  const { profile, role } = useAuthStore()
  const [handovers, setHandovers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { bookings } = useBookings()
  const [form, setForm] = useState({ booking_id: '', scheduled_date: '' })

  useEffect(() => {
    let mounted = true
    fetchHandovers(mounted)
    return () => { mounted = false }
  }, [])

  const fetchHandovers = async (mounted = true) => {
    setLoading(true)
    const { data } = await supabase
      .from('handovers')
      .select(`
        *,
        booking:bookings(buyer_name, buyer_phone, unit:units(nomor, tipe, blok, cluster), project:projects(name)),
        unit:units(nomor, tipe)
      `)
      .order('scheduled_date', { ascending: true })

    if (mounted) {
      setHandovers(data || [])
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.booking_id || !form.scheduled_date) {
      setFormError('Booking dan tanggal rencana wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const booking = bookings.find((b) => b.id === form.booking_id)
      const { error } = await supabase.from('handovers').insert([{
        booking_id: form.booking_id,
        unit_id: booking?.unit?.id || null,
        scheduled_date: form.scheduled_date,
        status: 'scheduled',
        checklist: DEFAULT_CHECKLIST,
        created_by: profile?.id,
      }])
      if (error) throw error
      setShowModal(false)
      setForm({ booking_id: '', scheduled_date: '' })
      fetchHandovers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <PageWrapper
      title="Serah Terima Unit"
      subtitle="Kelola proses handover dan generate BAST"
      actions={
        role === 'manager' && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Jadwalkan Serah Terima
          </Button>
        )
      }
    >
      {loading ? (
        <TableSkeleton />
      ) : handovers.length === 0 ? (
        <EmptyState
          icon={<Home size={48} />}
          title="Belum ada serah terima"
          description="Jadwalkan serah terima setelah unit siap diberikan ke pembeli"
          action={role === 'manager' && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Jadwalkan Serah Terima
            </Button>
          )}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pembeli</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tgl. Rencana</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tgl. Realisasi</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">BAST</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {handovers.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{h.booking?.buyer_name || '-'}</p>
                      <p className="text-xs text-gray-400">{h.booking?.buyer_phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      Unit {h.booking?.unit?.nomor || h.unit?.nomor || '-'} · {h.booking?.unit?.tipe || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.booking?.project?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(h.scheduled_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{h.actual_date ? formatDate(h.actual_date) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {h.bast_generated_at ? (
                        <Badge variant="success">Generated</Badge>
                      ) : (
                        <Badge variant="default">Belum</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={STATUS_VARIANTS[h.status]}>{STATUS_LABELS[h.status] || h.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/handovers/${h.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError('') }}
        title="Jadwalkan Serah Terima"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleCreate} loading={formLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>
          )}
          <Select label="Booking" required value={form.booking_id}
            onChange={(e) => setForm({ ...form, booking_id: e.target.value })}>
            <option value="">Pilih booking...</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.buyer_name} — Unit {b.unit?.nomor || '-'}
              </option>
            ))}
          </Select>
          <Input label="Tanggal Rencana Serah Terima" type="date" required
            value={form.scheduled_date}
            onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        </form>
      </Modal>
    </PageWrapper>
  )
}
