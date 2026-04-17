import { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Check, X } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate, KPR_STATUS_LABELS, isWithinDays } from '../../lib/utils'

const DEFAULT_DOCS = [
  'KTP Suami/Istri',
  'Kartu Keluarga (KK)',
  'NPWP',
  'Slip Gaji / SKP (3 bulan terakhir)',
  'Rekening Koran 3 Bulan',
  'Surat Nikah',
  'SPR dari Developer',
]

const kprStatuses = ['dokumen', 'ojk', 'appraisal', 'sp3k', 'akad', 'cair', 'ditolak']

const kprVariants = {
  dokumen: 'default', ojk: 'info', appraisal: 'purple',
  sp3k: 'warning', akad: 'orange', cair: 'success', ditolak: 'danger',
}

export default function KprDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const bookingId = searchParams.get('booking')
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  const isNew = id === 'new'
  const [kpr, setKpr] = useState(null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNotes, setStatusNotes] = useState('')
  const [newDoc, setNewDoc] = useState({ doc_name: '', due_date: '' })

  // New KPR form
  const [form, setForm] = useState({
    booking_id: bookingId || '',
    bank_name: '',
    submission_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    if (isNew) {
      supabase
        .from('bookings')
        .select('id, buyer_name, unit:units(nomor)')
        .eq('payment_method', 'kpr')
        .order('created_at', { ascending: false })
        .then(({ data }) => setBookings(data || []))
    }
  }, [isNew])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('kpr_tracking')
      .select(`
        *,
        booking:bookings(
          id, buyer_name, buyer_phone, payment_method, booking_date,
          unit:units(id, nomor, blok, cluster, tipe, harga),
          project:projects(id, name)
        ),
        kpr_documents(*)
      `)
      .eq('id', id)
      .single()

    setKpr(data)
    setDocs(data?.kpr_documents || [])
    setNewStatus(data?.status || 'dokumen')
    setLoading(false)
  }

  useEffect(() => { if (!isNew) fetchData() }, [id])

  const handleCreateKpr = async (e) => {
    e.preventDefault()
    if (!form.booking_id || !form.bank_name) {
      setFormError('Booking dan bank wajib diisi')
      return
    }
    setFormLoading(true)
    try {
      const { data, error } = await supabase
        .from('kpr_tracking')
        .insert([{ ...form, status: 'dokumen' }])
        .select()
        .single()

      if (error) throw error

      // Insert default documents
      const defaultDocs = DEFAULT_DOCS.map((name) => ({
        kpr_tracking_id: data.id,
        doc_name: name,
        is_complete: false,
      }))
      await supabase.from('kpr_documents').insert(defaultDocs)

      navigate(`/kpr/${data.id}`)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const toggleDoc = async (docId, current) => {
    await supabase
      .from('kpr_documents')
      .update({ is_complete: !current, updated_by: profile?.id, updated_at: new Date().toISOString() })
      .eq('id', docId)
    setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, is_complete: !current } : d))
  }

  const handleUpdateStatus = async () => {
    setFormLoading(true)
    try {
      const updates = { status: newStatus, notes: statusNotes, updated_by: profile?.id, updated_at: new Date().toISOString() }
      if (newStatus === 'sp3k') updates.sp3k_date = new Date().toISOString().split('T')[0]
      if (newStatus === 'akad') updates.akad_date = new Date().toISOString().split('T')[0]

      await supabase.from('kpr_tracking').update(updates).eq('id', id)
      setShowStatusModal(false)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddDoc = async () => {
    if (!newDoc.doc_name) return
    const { data } = await supabase
      .from('kpr_documents')
      .insert([{ kpr_tracking_id: id, doc_name: newDoc.doc_name, due_date: newDoc.due_date || null, is_complete: false }])
      .select()
      .single()

    setDocs((prev) => [...prev, data])
    setNewDoc({ doc_name: '', due_date: '' })
    setShowAddDocModal(false)
  }

  if (isNew) {
    return (
      <PageWrapper title="Buka Pengajuan KPR" subtitle="Tambah pengajuan KPR baru">
        <Link to="/kpr" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Kembali
        </Link>
        <div className="max-w-lg">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form onSubmit={handleCreateKpr} className="space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
              <Select label="Booking (Pembeli)" required value={form.booking_id}
                onChange={(e) => setForm({ ...form, booking_id: e.target.value })}>
                <option value="">Pilih booking KPR...</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.buyer_name} — Unit {b.unit?.nomor || '-'}
                  </option>
                ))}
              </Select>
              <Input label="Nama Bank" required value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="BCA, BRI, Mandiri, dll" />
              <Input label="Tanggal Pengajuan" type="date" value={form.submission_date} onChange={(e) => setForm({ ...form, submission_date: e.target.value })} />
              <Textarea label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" as={Link} to="/kpr">Batal</Button>
                <Button type="submit" loading={formLoading}>Buat Pengajuan KPR</Button>
              </div>
            </form>
          </div>
        </div>
      </PageWrapper>
    )
  }

  if (loading) return <PageWrapper><DetailSkeleton /></PageWrapper>
  if (!kpr) return <PageWrapper><p>KPR tidak ditemukan</p></PageWrapper>

  const completeDocs = docs.filter((d) => d.is_complete).length

  return (
    <PageWrapper
      title={`KPR — ${kpr.booking?.buyer_name || '-'}`}
      subtitle={`${kpr.bank_name} · Unit ${kpr.booking?.unit?.nomor || '-'}`}
      actions={
        <Button size="sm" onClick={() => { setNewStatus(kpr.status); setStatusNotes(''); setShowStatusModal(true) }}>
          Update Status
        </Button>
      }
    >
      <Link to="/kpr" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Kembali
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Status Timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Pengajuan</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {kprStatuses.map((s) => (
                <div
                  key={s}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    s === kpr.status
                      ? 'bg-primary-600 text-white border-primary-600'
                      : kprStatuses.indexOf(s) < kprStatuses.indexOf(kpr.status)
                      ? 'bg-primary-50 text-primary-600 border-primary-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}
                >
                  {KPR_STATUS_LABELS[s]}
                </div>
              ))}
            </div>
            {kpr.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">Catatan: {kpr.notes}</p>}
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              {kpr.submission_date && <p>Tanggal pengajuan: {formatDate(kpr.submission_date)}</p>}
              {kpr.sp3k_date && <p>SP3K: {formatDate(kpr.sp3k_date)}</p>}
              {kpr.akad_date && <p>Akad: {formatDate(kpr.akad_date)}</p>}
            </div>
          </div>

          {/* Checklist Dokumen */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Checklist Dokumen</h3>
                <p className="text-xs text-gray-400 mt-0.5">{completeDocs} dari {docs.length} dokumen lengkap</p>
              </div>
              <Button size="xs" variant="secondary" onClick={() => setShowAddDocModal(true)}>
                <Plus size={14} /> Tambah Dok.
              </Button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all"
                style={{ width: docs.length > 0 ? `${(completeDocs / docs.length) * 100}%` : '0%' }}
              />
            </div>

            <div className="space-y-2">
              {docs.map((doc) => {
                const nearExpiry = doc.due_date && isWithinDays(doc.due_date, 7)
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      doc.is_complete ? 'bg-green-50' : nearExpiry ? 'bg-orange-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDoc(doc.id, doc.is_complete)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${doc.is_complete ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                      {doc.is_complete && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${doc.is_complete ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {doc.doc_name}
                      </p>
                      {doc.due_date && (
                        <p className={`text-xs ${nearExpiry ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                          {nearExpiry ? '⚠ ' : ''}Batas: {formatDate(doc.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Info Pembeli</h3>
            <dl className="space-y-2 text-sm">
              {[
                { label: 'Nama', value: kpr.booking?.buyer_name },
                { label: 'No. HP', value: kpr.booking?.buyer_phone || '-' },
                { label: 'Unit', value: `Unit ${kpr.booking?.unit?.nomor || '-'}` },
                { label: 'Project', value: kpr.booking?.project?.name || '-' },
                { label: 'Bank', value: kpr.bank_name },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-0.5"><Badge variant={kprVariants[kpr.status]}>{KPR_STATUS_LABELS[kpr.status]}</Badge></dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status KPR"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Batal</Button>
            <Button onClick={handleUpdateStatus} loading={formLoading}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Status Baru" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            {kprStatuses.map((s) => <option key={s} value={s}>{KPR_STATUS_LABELS[s]}</option>)}
          </Select>
          <Textarea label="Catatan" value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} placeholder="Catatan perubahan status..." />
        </div>
      </Modal>

      {/* Add Doc Modal */}
      <Modal
        isOpen={showAddDocModal}
        onClose={() => setShowAddDocModal(false)}
        title="Tambah Dokumen"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddDocModal(false)}>Batal</Button>
            <Button onClick={handleAddDoc}>Tambah</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Nama Dokumen" required value={newDoc.doc_name} onChange={(e) => setNewDoc({ ...newDoc, doc_name: e.target.value })} placeholder="Nama dokumen..." />
          <Input label="Batas Tanggal" type="date" value={newDoc.due_date} onChange={(e) => setNewDoc({ ...newDoc, due_date: e.target.value })} />
        </div>
      </Modal>
    </PageWrapper>
  )
}
