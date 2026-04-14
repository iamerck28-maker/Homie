import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, AlertCircle, Users } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { useProspects } from '../../hooks/useProspects'
import { useProjects } from '../../hooks/useProjects'
import useAuthStore from '../../store/authStore'
import {
  formatDate,
  formatRelativeDate,
  isOverdue,
  PROSPECT_STATUS_LABELS,
  getProspectStatusColor,
} from '../../lib/utils'
import { supabase } from '../../lib/supabase'

const statusVariants = {
  new: 'info',
  followup: 'warning',
  survey: 'purple',
  negotiation: 'orange',
  closing: 'success',
  cancel: 'danger',
}

export default function ProspectListPage() {
  const { role, profile } = useAuthStore()
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { prospects, loading, error, addProspect, refetch } = useProspects(selectedProject || null)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [salesList, setSalesList] = useState([])
  const [form, setForm] = useState({
    project_id: '',
    full_name: '',
    phone: '',
    email: '',
    source: '',
    status: 'new',
    notes: '',
    assigned_to: '',
  })

  const overdue = prospects.filter(
    (p) => p.next_followup_at && isOverdue(p.next_followup_at) && p.status !== 'closing' && p.status !== 'cancel',
  )

  const filtered = prospects.filter((p) => {
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchSearch =
      !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
    return matchStatus && matchSearch
  })

  const fetchSales = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'marketing')
    setSalesList(data || [])
  }

  const openAddModal = () => {
    fetchSales()
    setForm({
      project_id: projects[0]?.id || '',
      full_name: '',
      phone: '',
      email: '',
      source: '',
      status: 'new',
      notes: '',
      assigned_to: role === 'marketing' ? profile?.id : '',
    })
    setFormError('')
    setShowAddModal(true)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.project_id) {
      setFormError('Nama dan project wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await addProspect({
        ...form,
        assigned_to: form.assigned_to || profile?.id,
        created_by: profile?.id,
      })
      setShowAddModal(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <PageWrapper
      title="Daftar Prospek"
      subtitle="Kelola prospek dan pipeline penjualan"
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" as={Link} to="/prospects/pipeline">
            Kanban View
          </Button>
          <Button size="sm" onClick={openAddModal}>
            <Plus size={16} /> Tambah Prospek
          </Button>
        </div>
      }
    >
      {/* Overdue reminder banner */}
      {overdue.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertCircle size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {overdue.length} prospek perlu di-follow-up hari ini!
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {overdue.map((p) => p.full_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari nama atau nomor HP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {role !== 'marketing' && (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Status</option>
          {Object.entries(PROSPECT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title="Belum ada prospek"
          description="Tambah prospek baru untuk mulai mengelola pipeline"
          action={<Button onClick={openAddModal} size="sm"><Plus size={16} /> Tambah Prospek</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kontak</th>
                  {role !== 'marketing' && <th className="text-left px-4 py-3 font-medium text-gray-600">Sales</th>}
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sumber</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Follow-up</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.full_name}</p>
                      {p.unit && <p className="text-xs text-gray-400">Unit {p.unit.nomor} - {p.unit.tipe}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.phone || '-'}</td>
                    {role !== 'marketing' && (
                      <td className="px-4 py-3 text-gray-600">{p.assigned_to_profile?.full_name || '-'}</td>
                    )}
                    <td className="px-4 py-3 text-gray-600">{p.source || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariants[p.status]}>{PROSPECT_STATUS_LABELS[p.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.next_followup_at ? (
                        <span className={isOverdue(p.next_followup_at) ? 'text-red-600 font-medium' : ''}>
                          {formatRelativeDate(p.next_followup_at)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/prospects/${p.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
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

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormError('') }}
        title="Tambah Prospek Baru"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button onClick={handleAdd} loading={formLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
          <Select label="Project" required value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
            <option value="">Pilih project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Input label="Nama Lengkap" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nama prospek" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="No. HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0812..." />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@..." />
          </div>
          <Input label="Sumber Lead" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Meta Ads, Referral, dll" />
          {role !== 'marketing' && salesList.length > 0 && (
            <Select label="Assign ke Sales" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">Pilih sales...</option>
              {salesList.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </Select>
          )}
          <Textarea label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan tambahan..." />
        </form>
      </Modal>
    </PageWrapper>
  )
}
