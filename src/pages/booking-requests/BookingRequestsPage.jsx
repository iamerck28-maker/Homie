import { useState, useEffect } from 'react'
import { Eye, Check, X, Clock } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate, formatRupiah, generateAccessCode } from '../../lib/utils'

const STATUS_LABELS = {
  pending: 'Menunggu Sales',
  approved_sales: 'Disetujui Sales',
  approved_manager: 'Disetujui Manager',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved_sales: 'bg-blue-100 text-blue-700',
  approved_manager: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function BookingRequestsPage() {
  const { profile, role } = useAuthStore()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('booking_requests')
      .select(`
        *,
        project:projects(id, name, location),
        unit:units(id, nomor, blok, cluster, tipe, harga)
      `)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRequests() }, [])

  const filtered = filterStatus === 'all'
    ? requests
    : requests.filter((r) => r.status === filterStatus)

  const canApprove = (req) => {
    if (role === 'marketing' && req.status === 'pending') return true
    if (role === 'manager' && req.status === 'approved_sales') return true
    return false
  }

  const canReject = (req) => {
    return (role === 'marketing' && req.status === 'pending') ||
      (role === 'manager' && (req.status === 'pending' || req.status === 'approved_sales'))
  }

  const canCancel = (req) => {
    return role === 'manager' && req.status === 'approved_manager'
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      if (role === 'marketing') {
        await supabase.from('booking_requests').update({
          status: 'approved_sales',
          sales_reviewed_by: profile.id,
          sales_reviewed_at: new Date().toISOString(),
        }).eq('id', selected.id)
      } else {
        // Manager final approve → buat booking resmi + hold unit
        const accessCode = generateAccessCode()
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert([{
            unit_id: selected.unit_id,
            project_id: selected.project_id,
            buyer_name: selected.buyer_name,
            buyer_phone: selected.buyer_phone,
            payment_method: selected.payment_method || null,
            booking_fee: selected.transfer_amount || null,
            booking_date: new Date().toISOString().split('T')[0],
            notes: selected.buyer_address,
            access_code: accessCode,
            created_by: profile.id,
          }])
          .select()
          .single()
        if (bookingError) throw bookingError

        await Promise.all([
          supabase.from('units').update({ status: 'hold', held_by: profile.id, held_at: new Date().toISOString() }).eq('id', selected.unit_id),
          supabase.from('booking_requests').update({
            status: 'approved_manager',
            booking_id: booking.id,
            manager_reviewed_by: profile.id,
            manager_reviewed_at: new Date().toISOString(),
          }).eq('id', selected.id),
        ])
      }

      setShowModal(false)
      setSelected(null)
      await fetchRequests()
    } catch (err) {
      console.error('Approve error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) return
    setActionLoading(true)
    try {
      const updates = {
        status: 'rejected',
        rejection_reason: rejectionReason,
        ...(role === 'marketing'
          ? { sales_reviewed_by: profile.id, sales_reviewed_at: new Date().toISOString() }
          : { manager_reviewed_by: profile.id, manager_reviewed_at: new Date().toISOString() }
        ),
      }
      await supabase.from('booking_requests').update(updates).eq('id', selected.id)
      setShowModal(false)
      setSelected(null)
      setRejectionReason('')
      setShowRejectForm(false)
      await fetchRequests()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) return
    setActionLoading(true)
    try {
      // Jika sudah disetujui manager, batalkan booking terkait dan lepas unit
      if (selected.status === 'approved_manager') {
        const { data: linkedBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('unit_id', selected.unit_id)
          .eq('buyer_phone', selected.buyer_phone)
          .is('cancelled_at', null)
          .single()

        if (linkedBooking) {
          await Promise.all([
            supabase.from('bookings').update({
              cancelled_at: new Date().toISOString(),
              cancellation_reason: cancelReason,
              cancelled_by: profile.id,
            }).eq('id', linkedBooking.id),
            supabase.from('units').update({ status: 'available', held_by: null, held_at: null }).eq('id', selected.unit_id),
          ])
        }
      }

      await supabase.from('booking_requests').update({
        status: 'cancelled',
        cancellation_reason: cancelReason,
        manager_reviewed_by: profile.id,
        manager_reviewed_at: new Date().toISOString(),
      }).eq('id', selected.id)

      setShowModal(false)
      setSelected(null)
      setCancelReason('')
      setShowCancelForm(false)
      await fetchRequests()
    } finally {
      setActionLoading(false)
    }
  }

  const openDetail = (req) => {
    setSelected(req)
    setShowRejectForm(false)
    setShowCancelForm(false)
    setRejectionReason('')
    setCancelReason('')
    setShowModal(true)
  }

  const pendingCount = requests.filter((r) => {
    if (role === 'marketing') return r.status === 'pending'
    if (role === 'manager') return r.status === 'approved_sales'
    return false
  }).length

  return (
    <PageWrapper
      title="Permintaan Booking"
      subtitle="Formulir booking dari konsumen"
    >
      {/* Filter */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {['all', 'pending', 'approved_sales', 'approved_manager', 'rejected', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterStatus === s
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {s === 'all' ? 'Semua' : STATUS_LABELS[s]}
            {s !== 'all' && s === (role === 'marketing' ? 'pending' : 'approved_sales') && pendingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Tidak ada permintaan booking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-gray-200 transition-colors cursor-pointer"
              onClick={() => openDetail(req)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-gray-900 text-sm">{req.buyer_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                    {STATUS_LABELS[req.status]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {req.project?.name} · Unit {req.unit?.nomor || '-'}
                  {req.unit?.blok ? ` Blok ${req.unit.blok}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{req.buyer_phone} · {formatDate(req.created_at)}</p>
              </div>
              <Eye size={16} className="text-gray-300 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setShowRejectForm(false); setShowCancelForm(false) }}
          title="Detail Permintaan Booking"
          footer={
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => { setShowModal(false); setShowRejectForm(false); setShowCancelForm(false) }}>
                Tutup
              </Button>
              {canCancel(selected) && !showRejectForm && !showCancelForm && (
                <Button variant="danger" onClick={() => setShowCancelForm(true)}>
                  <X size={14} /> Batalkan
                </Button>
              )}
              {canReject(selected) && !showRejectForm && !showCancelForm && (
                <Button variant="danger" onClick={() => setShowRejectForm(true)}>
                  <X size={14} /> Tolak
                </Button>
              )}
              {canApprove(selected) && !showRejectForm && !showCancelForm && (
                <Button onClick={handleApprove} loading={actionLoading}>
                  <Check size={14} /> {role === 'marketing' ? 'Setujui' : 'Setujui Final'}
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[selected.status]}`}>
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            {/* Data pembeli */}
            <div className="space-y-2">
              {[
                { label: 'Nama', value: selected.buyer_name },
                { label: 'WhatsApp', value: selected.buyer_phone },
                { label: 'Alamat', value: selected.buyer_address },
                { label: 'Tanggal', value: formatDate(selected.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className="font-medium text-gray-900 text-right">{value || '-'}</span>
                </div>
              ))}
            </div>

            {/* Unit */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Unit yang Diminati</p>
              <p className="font-semibold text-gray-900">
                {selected.project?.name} — Unit {selected.unit?.nomor || '-'}
                {selected.unit?.blok ? ` Blok ${selected.unit.blok}` : ''}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.unit?.tipe} · {formatRupiah(selected.unit?.harga)}
              </p>
            </div>

            {/* Transfer */}
            {selected.transfer_amount && (
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal Transfer</span>
                <span className="font-semibold text-gray-900">{formatRupiah(selected.transfer_amount)}</span>
              </div>
            )}

            {/* Dokumen */}
            <div className="space-y-2">
              {selected.ktp_url && (
                <a href={selected.ktp_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-xs font-medium">
                  <Eye size={13} /> Lihat KTP
                </a>
              )}
              {selected.transfer_proof_url && (
                <a href={selected.transfer_proof_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-xs font-medium">
                  <Eye size={13} /> Lihat Bukti Transfer
                </a>
              )}
            </div>

            {/* Rejection reason */}
            {selected.rejection_reason && selected.status === 'rejected' && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-medium text-red-600 mb-1">Alasan Penolakan</p>
                <p className="text-xs text-red-700">{selected.rejection_reason}</p>
              </div>
            )}

            {/* Cancellation reason */}
            {selected.cancellation_reason && selected.status === 'cancelled' && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Alasan Pembatalan</p>
                <p className="text-xs text-gray-600">{selected.cancellation_reason}</p>
              </div>
            )}

            {/* Reject form */}
            {showRejectForm && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-red-600">Alasan Penolakan</p>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowRejectForm(false)}>Batal</Button>
                  <Button variant="danger" size="sm" onClick={handleReject} loading={actionLoading} disabled={!rejectionReason.trim()}>
                    Konfirmasi Tolak
                  </Button>
                </div>
              </div>
            )}

            {/* Cancel form */}
            {showCancelForm && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">Alasan Pembatalan</p>
                {selected.status === 'approved_manager' && (
                  <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                    Permintaan ini sudah disetujui — booking terkait juga akan dibatalkan dan unit dikembalikan ke tersedia.
                  </p>
                )}
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Jelaskan alasan pembatalan..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setShowCancelForm(false)}>Batal</Button>
                  <Button variant="danger" size="sm" onClick={handleCancel} loading={actionLoading} disabled={!cancelReason.trim()}>
                    Konfirmasi Batalkan
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageWrapper>
  )
}
