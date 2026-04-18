import { useState, useEffect } from 'react'
import {
  Building2, Plus, Users, Trash2, UserPlus, MapPin, Edit2,
  Check, X, FolderOpen, Link2, Link2Off, PlusCircle, AlertTriangle,
} from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Input, { Select } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatDate } from '../../lib/utils'

const ROLE_LABEL = { owner: 'Owner', manager: 'Manager Marketing', marketing: 'Marketing' }
const ROLE_COLOR = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  marketing: 'bg-green-100 text-green-700',
}
const ROLE_VARIANT = { owner: 'purple', manager: 'info', marketing: 'success' }

// ─── Project Linker ───────────────────────────────────────────────────────────
const EMPTY_PROJECT_FORM = { name: '', location: '', description: '' }

function ProjectLinker({ company, onUpdated }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [toggling, setToggling] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_PROJECT_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = async () => {
    setLoading(true)
    setFetchError('')
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('id, name, status, company_id')
        .order('created_at', { ascending: false })
      if (err) throw err
      setProjects(data ?? [])
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProjects() }, [company.id])

  const toggle = async (project) => {
    const isLinked = project.company_id === company.id
    setToggling(project.id)
    await supabase
      .from('projects')
      .update({ company_id: isLinked ? null : company.id })
      .eq('id', project.id)
    await fetchProjects()
    onUpdated()
    setToggling(null)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama project wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .insert({
          name: form.name.trim(),
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          company_id: company.id,
          status: 'active',
        })
        .select()
        .single()
      if (err) throw err
      setForm(EMPTY_PROJECT_FORM)
      setShowForm(false)
      await fetchProjects()
      onUpdated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-xs text-gray-400 py-4 text-center">Memuat project...</div>
  if (fetchError) return (
    <div className="text-xs text-red-500 py-3 px-3 bg-red-50 rounded-lg">{fetchError}</div>
  )

  const linked = projects.filter((p) => p.company_id === company.id)
  const unlinked = projects.filter((p) => p.company_id !== company.id)

  return (
    <div className="space-y-1">
      {/* Tombol buat project baru */}
      {!showForm ? (
        <button
          onClick={() => { setShowForm(true); setError('') }}
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium mb-3 transition-colors"
        >
          <PlusCircle size={14} /> Buat Project Baru
        </button>
      ) : (
        <div className="mb-4 p-4 bg-primary-50 rounded-xl border border-primary-100 space-y-3">
          <p className="text-xs font-semibold text-primary-700">Project baru — akan langsung terhubung ke perusahaan ini</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nama project *"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Lokasi (opsional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi (opsional)"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <Check size={13} /> {saving ? 'Menyimpan...' : 'Buat Project'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_PROJECT_FORM); setError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white transition-colors"
            >
              <X size={13} /> Batal
            </button>
          </div>
        </div>
      )}

      {/* Linked projects */}
      {linked.length > 0 && (
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Terhubung</p>
      )}
      {linked.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-primary-50 border border-primary-100">
          <FolderOpen size={14} className="text-primary-500 flex-shrink-0" />
          <span className="text-sm flex-1 text-gray-900 font-medium truncate">{p.name}</span>
          <button
            onClick={() => toggle(p)}
            disabled={toggling === p.id}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            <Link2Off size={13} /> Putus
          </button>
        </div>
      ))}

      {/* Unlinked projects */}
      {unlinked.length > 0 && (
        <div className="mt-3 mb-2 flex items-center gap-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Project belum terhubung
          </p>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{unlinked.length}</span>
        </div>
      )}
      {unlinked.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border border-gray-100 hover:bg-gray-50">
          <FolderOpen size={14} className="text-gray-300 flex-shrink-0" />
          <span className="text-sm flex-1 text-gray-500 truncate">{p.name}</span>
          <button
            onClick={() => toggle(p)}
            disabled={toggling === p.id}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-40"
          >
            <Link2 size={13} /> Hubungkan
          </button>
        </div>
      ))}

      {!linked.length && !unlinked.length && !showForm && (
        <p className="text-xs text-gray-400 text-center py-2">Belum ada project. Buat project baru di atas.</p>
      )}
    </div>
  )
}

// ─── Member List ──────────────────────────────────────────────────────────────
function MemberList({ companyId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const { user } = useAuthStore()

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase.rpc('get_company_members', { p_company_id: companyId })
    setMembers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [companyId])

  const handleRemove = async (memberId) => {
    if (memberId === user.id) { alert('Tidak bisa menghapus diri sendiri'); return }
    if (!confirm('Hapus user ini dari perusahaan?')) return
    setRemovingId(memberId)
    await supabase.rpc('remove_user_from_company', { p_user_id: memberId, p_company_id: companyId })
    await fetch()
    setRemovingId(null)
  }

  if (loading) return <div className="text-xs text-gray-400 py-4 text-center">Memuat anggota...</div>
  if (!members.length) return <div className="text-xs text-gray-400 py-4 text-center">Belum ada anggota</div>

  return (
    <div className="divide-y divide-gray-50">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-gray-600">{m.full_name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{m.full_name}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[m.role]}`}>
            {ROLE_LABEL[m.role]}
          </span>
          {m.id !== user.id && (
            <button
              onClick={() => handleRemove(m.id)}
              disabled={removingId === m.id}
              className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Company Card ─────────────────────────────────────────────────────────────
function CompanyCard({ company, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: company.name, address: company.address || '' })
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [activePanel, setActivePanel] = useState(null) // 'projects' | 'members' | 'assign'
  const [assignEmail, setAssignEmail] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState('')

  const togglePanel = (panel) => {
    setActivePanel((prev) => prev === panel ? null : panel)
    setAssignError('')
    setAssignSuccess('')
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) return
    setSaving(true)
    await supabase
      .from('companies')
      .update({ name: editForm.name.trim(), address: editForm.address.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', company.id)
    setSaving(false)
    setEditing(false)
    onUpdated()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase.rpc('delete_company', { p_company_id: company.id })
    if (error) {
      setDeleteError(error.message)
      setDeleting(false)
    } else {
      onDeleted(company.id)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!assignEmail.trim()) return
    setAssignLoading(true)
    setAssignError('')
    setAssignSuccess('')
    const { error } = await supabase.rpc('assign_user_to_company', {
      p_email: assignEmail.trim().toLowerCase(),
      p_company_id: company.id,
    })
    if (error) setAssignError(error.message)
    else { setAssignSuccess(`${assignEmail} berhasil ditambahkan`); setAssignEmail('') }
    setAssignLoading(false)
  }

  const panelBtn = (key, icon, label) => (
    <button
      onClick={() => togglePanel(key)}
      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
        activePanel === key ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon} {label}
    </button>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        {editing ? (
          <div className="space-y-3">
            <input
              autoFocus
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Alamat (opsional)"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                <Check size={13} /> Simpan
              </button>
              <button onClick={() => { setEditing(false); setEditForm({ name: company.name, address: company.address || '' }) }} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                <X size={13} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{company.name}</h3>
              {company.address && (
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><MapPin size={11} /> {company.address}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => { setShowDeleteConfirm(true); setDeleteError('') }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tab buttons */}
      <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-gray-50">
        {panelBtn('projects', <FolderOpen size={13} />, 'Project')}
        {panelBtn('members', <Users size={13} />, 'Anggota')}
        {panelBtn('assign', <UserPlus size={13} />, 'Tambah User')}
      </div>

      {/* Panel: Projects */}
      {activePanel === 'projects' && (
        <div className="px-5 py-4"><ProjectLinker company={company} onUpdated={onUpdated} /></div>
      )}

      {/* Panel: Members */}
      {activePanel === 'members' && (
        <div className="px-5 py-3"><MemberList companyId={company.id} /></div>
      )}

      {/* Modal: Konfirmasi hapus */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Hapus Perusahaan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Hapus</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 rounded-xl">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">
              <p className="font-semibold mb-1">Tindakan ini tidak bisa dibatalkan.</p>
              <ul className="space-y-1 text-xs list-disc list-inside text-red-600">
                <li>Semua project akan di-unlink (tidak dihapus)</li>
                <li>Semua anggota akan dikeluarkan dari perusahaan ini</li>
                <li>Data booking, unit, dan KPR tetap aman</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Yakin ingin menghapus <strong>{company.name}</strong>?
          </p>
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
        </div>
      </Modal>

      {/* Panel: Assign user */}
      {activePanel === 'assign' && (
        <div className="px-5 py-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-3">Tambah user ke perusahaan ini via email</p>
          <form onSubmit={handleAssign} className="flex gap-2">
            <input
              type="email"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              placeholder="email@contoh.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              required
            />
            <button type="submit" disabled={assignLoading} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors whitespace-nowrap">
              {assignLoading ? '...' : 'Tambahkan'}
            </button>
          </form>
          {assignError && <p className="text-xs text-red-600 mt-2">{assignError}</p>}
          {assignSuccess && <p className="text-xs text-green-600 mt-2">{assignSuccess}</p>}
          <p className="text-xs text-gray-400 mt-2">User harus sudah terdaftar di Homie.</p>
        </div>
      )}
    </div>
  )
}

// ─── User Management Tab ──────────────────────────────────────────────────────
function UserManagementTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'marketing' })

  const fetchUsers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['marketing', 'manager'])
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password) { setFormError('Email, nama, dan password wajib diisi'); return }
    setFormLoading(true)
    setFormError('')
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'create', ...form },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setShowAddModal(false)
      setForm({ email: '', full_name: '', password: '', role: 'marketing' })
      await fetchUsers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setFormLoading(true)
    setDeleteError('')
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'delete', user_id: selectedUser.id },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setShowDeleteModal(false)
      setSelectedUser(null)
      await fetchUsers()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Semua Pengguna</h2>
          <p className="text-sm text-gray-500">Buat dan hapus akun marketing & manager</p>
        </div>
        <Button size="sm" onClick={() => { setFormError(''); setShowAddModal(true) }}>
          <Plus size={16} /> Tambah Pengguna
        </Button>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Users size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Belum ada pengguna</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bergabung</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setSelectedUser(u); setDeleteError(''); setShowDeleteModal(true) }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Pengguna Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button onClick={handleAdd} loading={formLoading}>Tambah</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
          <Input label="Nama Lengkap" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="marketing">Marketing</option>
            <option value="manager">Manager Marketing</option>
          </Select>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Pengguna"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={formLoading}>Hapus</Button>
          </>
        }
      >
        {deleteError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{deleteError}</div>}
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus akun <strong>{selectedUser?.full_name}</strong>? Data historisnya tetap tersimpan.
        </p>
      </Modal>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CompanySettingsPage() {
  const { companies, setCompanies, setActiveCompany, activeCompany } = useAuthStore()
  const [activeTab, setActiveTab] = useState('companies')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', address: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const handleCompanyDeleted = (deletedId) => {
    const updated = companies.filter((c) => c.id !== deletedId)
    setCompanies(updated)
    if (activeCompany?.id === deletedId) {
      setActiveCompany(updated.length > 0 ? updated[0] : null)
    }
  }

  const refetchCompanies = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_ids')
      .eq('id', (await supabase.auth.getUser()).data.user.id)
      .single()
    if (!profile?.company_ids?.length) return
    const { data } = await supabase.from('companies').select('*').in('id', profile.company_ids).order('name')
    if (data) {
      setCompanies(data)
      if (activeCompany) {
        const updated = data.find((c) => c.id === activeCompany.id)
        if (updated) setActiveCompany(updated)
      }
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.name.trim()) { setAddError('Nama perusahaan wajib diisi'); return }
    setAddLoading(true)
    setAddError('')
    try {
      const { data: companyId, error } = await supabase.rpc('create_company', {
        p_name: addForm.name.trim(),
        p_address: addForm.address.trim() || null,
      })
      if (error) throw error
      const { data: newCompany } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (newCompany) {
        const updated = [...companies, newCompany]
        setCompanies(updated)
        if (!activeCompany) setActiveCompany(newCompany)
      }
      setShowAddModal(false)
      setAddForm({ name: '', address: '' })
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddLoading(false)
    }
  }

  const tabs = [
    { key: 'companies', label: 'Perusahaan', icon: Building2 },
    { key: 'users', label: 'Pengguna', icon: Users },
  ]

  return (
    <PageWrapper
      title="Pengaturan"
      subtitle="Kelola perusahaan dan pengguna"
      actions={
        activeTab === 'companies' && (
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Tambah Perusahaan
          </Button>
        )
      }
    >
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Perusahaan */}
      {activeTab === 'companies' && (
        companies.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada perusahaan</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} onUpdated={refetchCompanies} onDeleted={handleCompanyDeleted} />
            ))}
          </div>
        )
      )}

      {/* Tab: Pengguna */}
      {activeTab === 'users' && <UserManagementTab />}

      {/* Add Company Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setAddError(''); setAddForm({ name: '', address: '' }) }}
        title="Tambah Perusahaan Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button onClick={handleAdd} loading={addLoading}>Buat Perusahaan</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {addError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{addError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Perusahaan <span className="text-red-500">*</span></label>
            <input
              autoFocus type="text" value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="PT. Griya Indah Nusantara"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat <span className="text-gray-400 font-normal">(opsional)</span></label>
            <textarea
              value={addForm.address}
              onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
              placeholder="Jl. Sudirman No. 1, Jakarta Pusat"
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}
