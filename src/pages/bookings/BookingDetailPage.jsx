import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate, formatRupiah, PAYMENT_METHOD_LABELS } from '../../lib/utils'
import { generateSPR } from '../../lib/spr'
import { useUnits } from '../../hooks/useUnits'
import { useProjects } from '../../hooks/useProjects'
import { usePayments } from '../../hooks/usePayments'

export default function BookingDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const prospectId = searchParams.get('prospect')
  const { profile, role } = useAuthStore()

  const isNew = id === 'new'
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(!isNew)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')


  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { units } = useUnits(selectedProject || null)
  const availableUnits = units.filter((u) => u.status === 'available')

  // Payments
  const { payments, totalPaid, addPayment, deletePayment } = usePayments(!isNew ? id : null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    type: 'dp', amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'transfer', notes: '',
  })
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const PAYMENT_TYPE_LABELS = { dp: 'Down Payment', cicilan: 'Cicilan', pelunasan: 'Pelunasan', lainnya: 'Lainnya' }
  const PAYMENT_METHOD_LABELS2 = { cash: 'Cash', transfer: 'Transfer', cek: 'Cek', giro: 'Giro' }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    if (!paymentForm.amount || !paymentForm.payment_date) {
      setPaymentError('Nominal dan tanggal wajib diisi')
      return
    }
    setPaymentLoading(true)
    setPaymentError('')
    try {
      await addPayment({ ...paymentForm, amount: parseFloat(paymentForm.amount), created_by: profile?.id })
      setShowPaymentModal(false)
      setPaymentForm({ type: 'dp', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transfer', notes: '' })
    } catch (err) {
      setPaymentError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const [form, setForm] = useState({
    prospect_id: prospectId || '',
    unit_id: '',
    project_id: '',
    buyer_name: '',
    buyer_phone: '',
    buyer_email: '',
    buyer_nik: '',
    booking_fee: '',
    booking_date: new Date().toISOString().split('T')[0],
    payment_method: 'kpr',
    notes: '',
  })

  const fetchBooking = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        unit:units(id, nomor, blok, cluster, tipe, harga),
        project:projects(id, name),
        prospect:prospects(id, full_name),
        kpr_tracking(*),
        created_by_profile:profiles!bookings_created_by_fkey(full_name)
      `)
      .eq('id', id)
      .single()

    setBooking(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!isNew) fetchBooking()
    if (prospectId) {
      supabase.from('prospects').select('full_name, phone, email').eq('id', prospectId).single()
        .then(({ data }) => {
          if (data) setForm((f) => ({ ...f, buyer_name: data.full_name, buyer_phone: data.phone || '', buyer_email: data.email || '' }))
        })
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.unit_id || !form.buyer_name || !form.booking_date) {
      setFormError('Unit, nama pembeli, dan tanggal booking wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        booking_fee: form.booking_fee ? parseFloat(form.booking_fee) : null,
        prospect_id: form.prospect_id || null,
        project_id: form.project_id || null,
        created_by: profile?.id,
      }
      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select()
        .single()

      if (error) throw error

      // Update unit status to hold
      await supabase.from('units').update({ status: 'hold', held_by: profile?.id, held_at: new Date().toISOString() }).eq('id', form.unit_id)

      window.location.href = `/bookings/${data.id}`
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleGenerateSPR = async () => {
    if (!booking) return
    try {
      generateSPR(booking)
      await supabase.from('bookings').update({ spr_generated_at: new Date().toISOString() }).eq('id', id)
      await fetchBooking()
    } catch (err) {
      console.error('SPR generation error:', err)
    }
  }

  if (isNew) {
    return (
      <PageWrapper title="Booking Baru" subtitle="Isi data booking unit">
        <Link to="/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>

        <div className="max-w-2xl">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}

              <Select label="Project" required value={form.project_id}
                onChange={(e) => { setForm({ ...form, project_id: e.target.value, unit_id: '' }); setSelectedProject(e.target.value) }}>
                <option value="">Pilih project...</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>

              <Select label="Unit" required value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
                <option value="">Pilih unit tersedia...</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>Unit {u.nomor} - {u.tipe} ({formatRupiah(u.harga)})</option>
                ))}
              </Select>

              <Input label="Nama Pembeli" required value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="No. HP" value={form.buyer_phone} onChange={(e) => setForm({ ...form, buyer_phone: e.target.value })} />
                <Input label="Email" type="email" value={form.buyer_email} onChange={(e) => setForm({ ...form, buyer_email: e.target.value })} />
              </div>
              <Input label="NIK" value={form.buyer_nik} onChange={(e) => setForm({ ...form, buyer_nik: e.target.value })} placeholder="16 digit NIK" />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Booking Fee (Rp)" type="number" value={form.booking_fee} onChange={(e) => setForm({ ...form, booking_fee: e.target.value })} />
                <Input label="Tanggal Booking" required type="date" value={form.booking_date} onChange={(e) => setForm({ ...form, booking_date: e.target.value })} />
              </div>
              <Select label="Metode Pembayaran" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Textarea label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" as={Link} to="/bookings">Batal</Button>
                <Button type="submit" loading={formLoading}>Simpan Booking</Button>
              </div>
            </form>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (loading) return <PageWrapper><LoadingSpinner /></PageWrapper>
  if (!booking) return <PageWrapper><p>Booking tidak ditemukan</p></PageWrapper>

  return (
    <PageWrapper
      title={`Booking — ${booking.buyer_name}`}
      subtitle={`Unit ${booking.unit?.nomor || '-'} · ${booking.project?.name || '-'}`}
      actions={
        <Button size="sm" onClick={handleGenerateSPR}>
          <FileText size={14} /> {booking.spr_generated_at ? 'Cetak Ulang SPR' : 'Generate SPR'}
        </Button>
      }
    >
      <Link to="/bookings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Kembali
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Pembeli</h3>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Nama', value: booking.buyer_name },
              { label: 'No. HP', value: booking.buyer_phone || '-' },
              { label: 'Email', value: booking.buyer_email || '-' },
              { label: 'NIK', value: booking.buyer_nik || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Data Booking</h3>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Unit', value: `Unit ${booking.unit?.nomor || '-'}` },
              { label: 'Tipe', value: booking.unit?.tipe || '-' },
              { label: 'Harga Unit', value: formatRupiah(booking.unit?.harga) },
              { label: 'Booking Fee', value: formatRupiah(booking.booking_fee) },
              { label: 'Tanggal', value: formatDate(booking.booking_date) },
              { label: 'Metode', value: PAYMENT_METHOD_LABELS[booking.payment_method] || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">SPR</dt>
              <dd>{booking.spr_generated_at ? <Badge variant="success">Generated {formatDate(booking.spr_generated_at)}</Badge> : <Badge>Belum</Badge>}</dd>
            </div>
          </dl>
        </div>

        {booking.payment_method === 'kpr' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">KPR Tracking</h3>
              {!booking.kpr_tracking?.length && (
                <Button size="xs" as={Link} to={`/kpr/new?booking=${id}`}>
                  <Plus size={14} /> Buka KPR
                </Button>
              )}
            </div>
            {booking.kpr_tracking?.length ? (
              <div className="space-y-2 text-sm">
                {booking.kpr_tracking.map((k) => (
                  <div key={k.id} className="flex justify-between">
                    <span className="text-gray-600">{k.bank_name}</span>
                    <Link to={`/kpr/${k.id}`} className="text-primary-600 text-xs font-medium">
                      Lihat Detail →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Belum ada pengajuan KPR</p>
            )}
          </div>
        )}

        {/* Tracking Pembayaran */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Riwayat Pembayaran</h3>
              {booking.unit?.harga > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Terbayar: {formatRupiah(totalPaid)} / {formatRupiah(booking.unit?.harga)}
                  {booking.unit?.harga > 0 && (
                    <span className="ml-1 text-primary-600 font-medium">
                      ({Math.round((totalPaid / booking.unit.harga) * 100)}%)
                    </span>
                  )}
                </p>
              )}
            </div>
            <Button size="xs" onClick={() => setShowPaymentModal(true)}>
              <Plus size={14} /> Tambah
            </Button>
          </div>

          {/* Progress bar */}
          {booking.unit?.harga > 0 && (
            <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPaid / booking.unit.harga) * 100)}%` }}
              />
            </div>
          )}

          {payments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Belum ada riwayat pembayaran</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-xs bg-primary-50 text-primary-700 font-medium px-2 py-1 rounded">
                      {PAYMENT_TYPE_LABELS[p.type]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatRupiah(p.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.payment_date)} · {PAYMENT_METHOD_LABELS2[p.payment_method]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.notes && <p className="text-xs text-gray-400 max-w-[150px] truncate">{p.notes}</p>}
                    {role === 'manager' && (
                      <button onClick={() => deletePayment(p.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal tambah pembayaran */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentError('') }}
        title="Tambah Pembayaran"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Batal</Button>
            <Button onClick={handleAddPayment} loading={paymentLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleAddPayment} className="space-y-4">
          {paymentError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{paymentError}</div>
          )}
          <Select label="Jenis Pembayaran" value={paymentForm.type}
            onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Nominal (Rp)" type="number" required value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Input label="Tanggal Bayar" type="date" required value={paymentForm.payment_date}
            onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
          <Select label="Metode" value={paymentForm.payment_method}
            onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
            {Object.entries(PAYMENT_METHOD_LABELS2).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea label="Catatan" value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
        </form>
      </Modal>
    </PageWrapper>
  )
}
