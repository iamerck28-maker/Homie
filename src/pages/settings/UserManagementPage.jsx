import { useState, useEffect } from 'react'
import { Plus, Trash2, Users } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'

const roleLabels = { marketing: 'Marketing', manager: 'Manager Marketing', owner: 'Owner' }
const roleVariants = { marketing: 'success', manager: 'info', owner: 'purple' }

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
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

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password) {
      setFormError('Email, nama, dan password wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      // Create auth user via admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.password,
        email_confirm: true,
        user_metadata: { full_name: form.full_name },
      })

      if (authError) throw authError

      // Insert profile
      await supabase.from('profiles').insert([{
        id: authData.user.id,
        full_name: form.full_name,
        role: form.role,
      }])

      setShowAddModal(false)
      setForm({ email: '', full_name: '', password: '', role: 'marketing' })
      await fetchUsers()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setFormLoading(true)
    try {
      await supabase.auth.admin.deleteUser(selectedUser.id)
      setShowDeleteModal(false)
      setSelectedUser(null)
      await fetchUsers()
    } catch (err) {
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <PageWrapper
      title="Manajemen Pengguna"
      subtitle="Kelola akun marketing dan manager"
      actions={
        <Button size="sm" onClick={() => { setFormError(''); setShowAddModal(true) }}>
          <Plus size={16} /> Tambah Pengguna
        </Button>
      }
    >
      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="Belum ada pengguna" action={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus size={16} /> Tambah Pengguna</Button>} />
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
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={roleVariants[u.role]}>{roleLabels[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { setSelectedUser(u); setShowDeleteModal(true) }}
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
            <Button onClick={handleAddUser} loading={formLoading}>Tambah</Button>
          </>
        }
      >
        <form onSubmit={handleAddUser} className="space-y-4">
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
            <Button variant="danger" onClick={handleDeleteUser} loading={formLoading}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus akun <strong>{selectedUser?.full_name}</strong>? Pengguna tidak bisa login tapi data historisnya tetap tersimpan.
        </p>
      </Modal>
    </PageWrapper>
  )
}
