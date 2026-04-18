import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FolderOpen, MapPin, Save, Trash2, Users, UserPlus,
  ArrowLeft, AlertTriangle, CheckCircle2, KeyRound,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

const ROLE_LABEL = { owner: 'Owner', manager: 'Manager', marketing: 'Marketing' }
const ROLE_VARIANT = { owner: 'purple', manager: 'info', marketing: 'success' }

// ─── Info Tab ─────────────────────────────────────────────────────────────────
function InfoTab({ project, managers, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    name: project.name || '',
    location: project.location || '',
    description: project.description || '',
    status: project.status || 'active',
    manager_id: project.manager_id || '',
    bank_name: project.bank_name || '',
    bank_account_number: project.bank_account_number || '',
    bank_account_name: project.bank_account_name || '',
    booking_fee_default: project.booking_fee_default ?? '',
    booking_code: project.booking_code || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama proyek wajib diisi'); return }
    setSaving(true)
    setError('')
    setSuccess('')
    const { error: err } = await supabase
      .from('projects')
      .update({
        name: form.name.trim(),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        status: form.status,
        manager_id: form.manager_id || null,
        bank_name: form.bank_name.trim() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_account_name: form.bank_account_name.trim() || null,
        booking_fee_default: form.booking_fee_default ? Number(form.booking_fee_default) : null,
        booking_code: form.booking_code.trim().toUpperCase() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess('Tersimpan')
    setTimeout(() => setSuccess(''), 2500)
    onSaved()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    const { error: err } = await supabase.from('projects').delete().eq('id', project.id)
    if (err) { setDeleteError(err.message); setDeleting(false); return }
    onDeleted()
  }

  const field = (label, key, opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        {...opts}
      />
    </div>
  )

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={15} /> {success}</div>}

      {/* Info Dasar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Info Dasar</p>
        {field('Nama Proyek *', 'name', { placeholder: 'Grand Village Cirebon', required: true })}
        {field('Lokasi', 'location', { placeholder: 'Cirebon, Jawa Barat' })}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Deskripsi singkat proyek..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="active">Aktif</option>
              <option value="paused">Ditunda</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager Proyek</label>
            <select
              value={form.manager_id}
              onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">— Pilih Manager —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Booking */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pengaturan Booking</p>
        <div className="grid grid-cols-2 gap-4">
          {field('Kode Booking', 'booking_code', { placeholder: 'GVC26', maxLength: 10 })}
          {field('Booking Fee Default (Rp)', 'booking_fee_default', { type: 'number', placeholder: '5000000' })}
        </div>
      </div>

      {/* Bank */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rekening Bank</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('Nama Bank', 'bank_name', { placeholder: 'BCA' })}
          {field('No. Rekening', 'bank_account_number', { placeholder: '1234567890' })}
          {field('Atas Nama', 'bank_account_name', { placeholder: 'PT Griya Indah' })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="submit" loading={saving}>
          <Save size={16} /> Simpan Perubahan
        </Button>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={15} /> Hapus Proyek
        </button>
      </div>

      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Hapus Proyek"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(false)} disabled={deleting}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Hapus</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-semibold mb-1">Tindakan ini tidak bisa dibatalkan.</p>
              <p className="text-xs text-red-600">Data unit, booking, dan KPR yang terhubung ke proyek ini akan terpengaruh.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Yakin ingin menghapus proyek <strong>{project.name}</strong>?
          </p>
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
        </div>
      </Modal>
    </form>
  )
}

// ─── Tim Tab ──────────────────────────────────────────────────────────────────
function TimTab({ projectId }) {
  const [members, setMembers] = useState([])
  const [emailMap, setEmailMap] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [assignError, setAssignError] = useState('')

  // Reset password
  const [resetUserId, setResetUserId] = useState(null)
  const [resetUserName, setResetUserName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')

  const fetchMembers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, project_ids')
      .in('role', ['marketing', 'manager'])
      .order('full_name')
    const all = data || []
    const inProject = all.filter((u) => (u.project_ids || []).includes(projectId))
    setMembers(inProject)
    setAllUsers(all)

    if (inProject.length > 0) {
      const { data: emails } = await supabase.rpc('get_users_email', {
        p_user_ids: inProject.map((u) => u.id),
      })
      const map = {}
      ;(emails || []).forEach((e) => { map[e.id] = e.email })
      setEmailMap(map)
    }
    setLoading(false)
  }

  useEffect(() => { fetchMembers() }, [projectId])

  const nonMembers = allUsers.filter((u) => !(u.project_ids || []).includes(projectId))

  const handleAssign = async () => {
    if (!selectedUserId) return
    setAssigning(true)
    setAssignError('')
    const { error } = await supabase.rpc('assign_user_to_project', {
      p_user_id: selectedUserId,
      p_project_id: projectId,
    })
    setAssigning(false)
    if (error) { setAssignError(error.message); return }
    setShowAddModal(false)
    setSelectedUserId('')
    fetchMembers()
  }

  const handleRemove = async (memberId) => {
    if (!window.confirm('Keluarkan user ini dari proyek?')) return
    setRemovingId(memberId)
    await supabase.rpc('remove_user_from_project', {
      p_user_id: memberId,
      p_project_id: projectId,
    })
    await fetchMembers()
    setRemovingId(null)
  }

  const openReset = (m) => {
    setResetUserId(m.id)
    setResetUserName(m.full_name)
    setNewPassword('')
    setResetError('')
    setResetSuccess('')
  }

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) { setResetError('Password minimal 6 karakter'); return }
    setResetting(true)
    setResetError('')
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action: 'update_password', user_id: resetUserId, password: newPassword },
    })
    setResetting(false)
    if (error || data?.error) { setResetError(error?.message || data?.error); return }
    setResetSuccess('Password berhasil diubah')
    setNewPassword('')
    setTimeout(() => { setResetUserId(null); setResetSuccess('') }, 1800)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Tim Proyek</h3>
          <p className="text-sm text-gray-500">{members.length} anggota</p>
        </div>
        <Button size="sm" onClick={() => { setAssignError(''); setSelectedUserId(''); setShowAddModal(true) }}>
          <UserPlus size={15} /> Tambah Tim
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton /></div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada anggota tim</p>
            <p className="text-xs mt-1">Tambah marketing atau manager ke proyek ini</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-gray-600">{m.full_name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <span className="font-medium text-gray-900 truncate">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {emailMap[m.id] || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ROLE_VARIANT[m.role]}>{ROLE_LABEL[m.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openReset(m)}
                        className="p-1.5 text-gray-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Reset password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => handleRemove(m.id)}
                        disabled={removingId === m.id}
                        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        title="Keluarkan dari proyek"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Tambah anggota */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Anggota Tim"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button onClick={handleAssign} loading={assigning} disabled={!selectedUserId}>Tambahkan</Button>
          </>
        }
      >
        <div className="space-y-4">
          {assignError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{assignError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Pengguna</label>
            {nonMembers.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Semua pengguna sudah menjadi anggota proyek ini.</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">— Pilih pengguna —</option>
                {nonMembers.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name} ({ROLE_LABEL[u.role]})</option>
                ))}
              </select>
            )}
          </div>
          <p className="text-xs text-gray-400">Pengguna yang dipilih akan mendapat akses ke data proyek ini.</p>
        </div>
      </Modal>

      {/* Modal: Reset password */}
      <Modal
        isOpen={!!resetUserId}
        onClose={() => setResetUserId(null)}
        title={`Reset Password — ${resetUserName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetUserId(null)} disabled={resetting}>Batal</Button>
            <Button onClick={handleReset} loading={resetting}>Simpan Password</Button>
          </>
        }
      >
        <div className="space-y-4">
          {resetError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{resetError}</div>}
          {resetSuccess && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2"><CheckCircle2 size={15} /> {resetSuccess}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
            <input
              autoFocus
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="text-xs text-gray-400">Password lama akan langsung diganti. User perlu login ulang menggunakan password baru.</p>
        </div>
      </Modal>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [notFound, setNotFound] = useState(false)

  const fetchProject = async () => {
    const [{ data: proj }, { data: mgrs }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('profiles').select('id, full_name').eq('role', 'manager').order('full_name'),
    ])
    if (!proj) { setNotFound(true); setLoading(false); return }
    setProject(proj)
    setManagers(mgrs || [])
    setLoading(false)
  }

  useEffect(() => { fetchProject() }, [id])

  if (loading) {
    return (
      <PageWrapper title="Proyek">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-48 bg-gray-100 rounded-xl" />
        </div>
      </PageWrapper>
    )
  }

  if (notFound) {
    return (
      <PageWrapper title="Proyek">
        <div className="text-center py-20 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Proyek tidak ditemukan</p>
          <button onClick={() => navigate('/projects')} className="mt-3 text-sm text-primary-600 hover:underline">
            Kembali ke daftar proyek
          </button>
        </div>
      </PageWrapper>
    )
  }

  const tabs = [
    { key: 'info', label: 'Info Proyek', icon: FolderOpen },
    { key: 'tim', label: 'Tim', icon: Users },
  ]

  return (
    <PageWrapper
      title={project.name}
      subtitle={project.location || 'Proyek'}
      actions={
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} /> Kembali
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <InfoTab
          project={project}
          managers={managers}
          onSaved={fetchProject}
          onDeleted={() => navigate('/projects')}
        />
      )}
      {activeTab === 'tim' && <TimTab projectId={id} />}
    </PageWrapper>
  )
}
