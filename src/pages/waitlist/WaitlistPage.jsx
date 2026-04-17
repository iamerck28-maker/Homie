import { useState, useEffect } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { useProjects } from '../../hooks/useProjects'
import { formatDate } from '../../lib/utils'

const STATUS_LABELS = { waiting: 'Waiting', invited: 'Diundang', converted: 'Jadi Pembeli', cancelled: 'Batal' }
const STATUS_VARIANTS = { waiting: 'warning', invited: 'info', converted: 'success', cancelled: 'danger' }

export default function WaitlistPage() {
  const { profile, role } = useAuthStore()
  const { projects } = useProjects()
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState('')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    project_id: '', full_name: '', phone: '', email: '',
    unit_preference: '', notes: '', assigned_to: '',
  })
  const [marketingUsers, setMarketingUsers] = useState([])

  useEffect(() => {
    let mounted = true
    fetchWaitlist(mounted)
    return () => { mounted = false }
  }, [selectedProject])

  useEffect(() => {
    if (role === 'manager') {
      supabase.from('profiles').select('id, full_name').eq('role', 'marketing').then(({ data }) => {
        setMarketingUsers(data || [])
      })
    }
  }, [role])

  const fetchWaitlist = async (mounted = true) => {
    setLoading(true)
    let query = supabase
      .from('waitlist')
      .select('*, project:projects(name), assigned_to_profile:profiles!waitlist_assigned_to_fkey(full_name)')
      .order('nup_number', { ascending: true })

    if (selectedProject) query = query.eq('project_id', selectedProject)

    const { data } = await query
    if (mounted) {
      setWaitlist(data || [])
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.project_id || !form.full_name || !form.phone) {
      setFormError('Project, nama, dan no. HP wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const { error } = await supabase.from('waitlist').insert([{
        project_id: form.project_id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        unit_preference: form.unit_preference || null,
        notes: form.notes || null,
        assigned_to: form.assigned_to || profile?.id,
        created_by: profile?.id,
        status: 'waiting',
      }])
      if (error) throw error
      setShowModal(false)
      setForm({ project_id: '', full_name: '', phone: '', email: '', unit_preference: '', notes: '', assigned_to: '' })
      fetchWaitlist()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    const updates = { status }
    if (status === 'invited') updates.invited_at = new Date().toISOString().split('T')[0]
    await supabase.from('waitlist').update(updates).eq('id', id)
    fetchWaitlist()
  }

  const filtered = waitlist.filter((w) => {
    if (!search) return true
    const q = search.toLowerCase()
    return w.full_name?.toLowerCase().includes(q) || w.phone?.includes(q)
  })

  const stats = {
    total: waitlist.length,
    waiting: waitlist.filter((w) => w.status === 'waiting').length,
    invited: waitlist.filter((w) => w.status === 'invited').length,
    converted: waitlist.filter((w) => w.status === 'converted').length,
  }

  return (
    <PageWrapper
      title="NUP / Waitlist"
      subtitle="Kelola antrian calon pembeli sebelum launching"
      actions={
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Daftar NUP
        </Button>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Daftar', value: stats.total, color: 'text-gray-900' },
          { label: 'Waiting', value: stats.waiting, color: 'text-orange-600' },
          { label: 'Diundang', value: stats.invited, color: 'text-blue-600' },
          { label: 'Jadi Pembeli', value: stats.converted, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Cari nama atau no. HP..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Semua Project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users size={48} />} title="Belum ada pendaftar NUP"
          description="Catat calon pembeli yang ingin antri sebelum launching"
          action={<Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Daftar NUP</Button>} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-center px-3 py-3 font-medium text-gray-600 w-12">NUP</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kontak</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Minat Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sales</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tgl. Daftar</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  {role === 'manager' && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                        {w.nup_number}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{w.full_name}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700">{w.phone}</p>
                      {w.email && <p className="text-xs text-gray-400">{w.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{w.project?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{w.unit_preference || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{w.assigned_to_profile?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(w.registered_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={STATUS_VARIANTS[w.status]}>{STATUS_LABELS[w.status]}</Badge>
                    </td>
                    {role === 'manager' && (
                      <td className="px-4 py-3 text-right">
                        <select
                          value={w.status}
                          onChange={(e) => handleUpdateStatus(w.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setFormError('') }}
        title="Daftarkan NUP Baru" size="md"
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
          <Select label="Project" required value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
            <option value="">Pilih project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input label="Nama Lengkap" required value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="No. HP" required value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Preferensi Unit" value={form.unit_preference}
            onChange={(e) => setForm({ ...form, unit_preference: e.target.value })}
            placeholder="cth: Type 36, lokasi pojok" />
          {role === 'manager' && marketingUsers.length > 0 && (
            <Select label="Assign ke Sales" value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">Pilih sales...</option>
              {marketingUsers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </Select>
          )}
          <Textarea label="Catatan" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>
    </PageWrapper>
  )
}
