import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, UserCheck, Calendar } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import {
  formatDate,
  formatRelativeDate,
  isOverdue,
  PROSPECT_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  getProspectStatusColor,
} from '../../lib/utils'

const statusVariants = {
  new: 'info',
  followup: 'warning',
  survey: 'purple',
  negotiation: 'orange',
  closing: 'success',
  cancel: 'danger',
}

const activityIcons = {
  call: '📞',
  whatsapp: '💬',
  visit: '🏠',
  meeting: '🤝',
  note: '📝',
}

export default function ProspectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, profile } = useAuthStore()
  const [prospect, setProspect] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [salesList, setSalesList] = useState([])

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showFollowupModal, setShowFollowupModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [activityForm, setActivityForm] = useState({ activity_type: 'call', notes: '' })
  const [newStatus, setNewStatus] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [assignTo, setAssignTo] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase
        .from('prospects')
        .select(`
          *,
          assigned_to_profile:profiles!prospects_assigned_to_fkey(id, full_name),
          unit:units(id, nomor, blok, cluster, tipe, harga),
          project:projects(id, name),
          campaign:campaigns(id, name, channel)
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('prospect_activities')
        .select('*, profiles!prospect_activities_created_by_fkey(full_name)')
        .eq('prospect_id', id)
        .order('created_at', { ascending: false }),
    ])

    setProspect(p)
    setActivities(a || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  useEffect(() => {
    if (role === 'manager') {
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'marketing')
        .order('full_name')
        .then(({ data }) => setSalesList(data || []))
    }
  }, [role])

  const handleAddActivity = async (e) => {
    e.preventDefault()
    if (!activityForm.notes) return
    setActionLoading(true)
    try {
      await supabase.from('prospect_activities').insert([{
        prospect_id: id,
        ...activityForm,
        created_by: profile?.id,
      }])
      setActivityForm({ activity_type: 'call', notes: '' })
      setShowActivityModal(false)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) return
    setActionLoading(true)
    try {
      await supabase.from('prospects').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
      setShowStatusModal(false)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetFollowup = async () => {
    if (!followupDate) return
    setActionLoading(true)
    try {
      await supabase.from('prospects').update({ next_followup_at: followupDate, updated_at: new Date().toISOString() }).eq('id', id)
      setShowFollowupModal(false)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setActionLoading(true)
    try {
      await supabase.from('prospects').update({ assigned_to: assignTo, updated_at: new Date().toISOString() }).eq('id', id)
      await fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await supabase.from('prospects').delete().eq('id', id)
      navigate('/prospects')
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(false)
    }
  }

  const canEdit = role === 'manager' || (role === 'marketing' && prospect?.assigned_to === profile?.id)

  if (loading) return <PageWrapper><LoadingSpinner /></PageWrapper>
  if (!prospect) return <PageWrapper><p className="text-gray-500">Prospek tidak ditemukan</p></PageWrapper>

  return (
    <PageWrapper title={prospect.full_name} subtitle={`Project: ${prospect.project?.name || '-'}`}>
      <Link to="/prospects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Kembali ke daftar prospek
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{prospect.full_name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{prospect.phone || '-'} · {prospect.email || '-'}</p>
              </div>
              <Badge variant={statusVariants[prospect.status]}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Sumber', value: prospect.source || '-' },
                { label: 'Sales', value: prospect.assigned_to_profile?.full_name || '-' },
                { label: 'Unit Diminati', value: prospect.unit ? `Unit ${prospect.unit.nomor} (${prospect.unit.tipe || '-'})` : '-' },
                { label: 'Campaign', value: prospect.campaign?.name || '-' },
                { label: 'Masuk', value: formatDate(prospect.created_at) },
                {
                  label: 'Follow-up Berikutnya',
                  value: prospect.next_followup_at
                    ? <span className={isOverdue(prospect.next_followup_at) ? 'text-red-600 font-medium' : ''}>{formatDate(prospect.next_followup_at)}</span>
                    : '-',
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-gray-500 mb-0.5">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            {prospect.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Catatan</p>
                <p className="text-sm text-gray-700">{prospect.notes}</p>
              </div>
            )}
          </div>

          {/* Activity log */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Riwayat Aktivitas</h3>
              {canEdit && (
                <Button size="xs" onClick={() => setShowActivityModal(true)}>
                  <Plus size={14} /> Tambah
                </Button>
              )}
            </div>

            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Belum ada aktivitas</p>
            ) : (
              <div className="space-y-4">
                {activities.map((a) => (
                  <div key={a.id} className="flex gap-3">
                    <span className="text-lg flex-shrink-0">{activityIcons[a.activity_type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">{ACTIVITY_TYPE_LABELS[a.activity_type]}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{a.profiles?.full_name || '-'}</span>
                      </div>
                      <p className="text-sm text-gray-700">{a.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-4">
          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Aksi</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => { setNewStatus(prospect.status); setShowStatusModal(true) }}>
                  Ubah Status
                </Button>
                <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => setShowFollowupModal(true)}>
                  <Calendar size={14} /> Set Follow-up
                </Button>
                {role === 'manager' && (
                  <Button
                    variant="danger"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={14} /> Hapus Prospek
                  </Button>
                )}
              </div>
            </div>
          )}

          {role === 'manager' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Assign Sales</h3>
              <Select
                value={assignTo || prospect.assigned_to}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">Pilih sales...</option>
                {salesList.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </Select>
              <Button className="w-full mt-3" size="sm" onClick={handleAssign} loading={actionLoading}>
                <UserCheck size={14} /> Assign
              </Button>
            </div>
          )}

          {prospect.status === 'closing' && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Booking</h3>
              <p className="text-xs text-gray-500 mb-3">Prospek ini sudah closing. Buat booking?</p>
              <Button as={Link} to={`/bookings/new?prospect=${id}`} className="w-full" size="sm">
                Buat Booking
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Activity Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Tambah Aktivitas"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowActivityModal(false)}>Batal</Button>
            <Button onClick={handleAddActivity} loading={actionLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleAddActivity} className="space-y-4">
          <Select
            label="Tipe Aktivitas"
            value={activityForm.activity_type}
            onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
          >
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea
            label="Catatan"
            required
            value={activityForm.notes}
            onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
            placeholder="Tulis hasil aktivitas..."
            rows={4}
          />
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Ubah Status Prospek"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Batal</Button>
            <Button onClick={handleUpdateStatus} loading={actionLoading}>Simpan</Button>
          </>
        }
      >
        <Select
          label="Status Baru"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
        >
          {Object.entries(PROSPECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Modal>

      {/* Set Follow-up Modal */}
      <Modal
        isOpen={showFollowupModal}
        onClose={() => setShowFollowupModal(false)}
        title="Set Jadwal Follow-Up"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowFollowupModal(false)}>Batal</Button>
            <Button onClick={handleSetFollowup} loading={actionLoading}>Simpan</Button>
          </>
        }
      >
        <Input
          label="Tanggal Follow-Up"
          type="datetime-local"
          value={followupDate}
          onChange={(e) => setFollowupDate(e.target.value)}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Prospek"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus prospek <strong>{prospect.full_name}</strong>? Semua riwayat aktivitas juga akan dihapus.
        </p>
      </Modal>
    </PageWrapper>
  )
}
