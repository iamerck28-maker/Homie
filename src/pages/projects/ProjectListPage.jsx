import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, MapPin, Users, Building2, ChevronRight, CheckCircle2, PauseCircle, XCircle } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

const STATUS_CONFIG = {
  active: { label: 'Aktif', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  paused: { label: 'Ditunda', icon: PauseCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  completed: { label: 'Selesai', icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-50' },
}

const EMPTY_FORM = { name: '', location: '', description: '' }

function ProjectCard({ project, onClick }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active
  const StatusIcon = cfg.icon
  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-5 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
          <FolderOpen size={18} className="text-primary-600" />
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
          <StatusIcon size={12} />
          {cfg.label}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-primary-700 transition-colors">
        {project.name}
      </h3>
      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3 min-h-[16px]">
        {project.location ? <><MapPin size={11} /> {project.location}</> : <span className="text-gray-300 italic">Lokasi belum diisi</span>}
      </p>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-50">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{project._unitCount ?? 0}</p>
          <p className="text-xs text-gray-400">Unit</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-green-600">{project._availableCount ?? 0}</p>
          <p className="text-xs text-gray-400">Tersedia</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{project._teamCount ?? 0}</p>
          <p className="text-xs text-gray-400">Tim</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 min-h-[32px]">
        {project._managerName ? (
          <>
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-blue-700">{project._managerName[0]?.toUpperCase()}</span>
            </div>
            <span className="text-xs text-gray-500 truncate">{project._managerName}</span>
            <Badge variant="info" className="ml-auto text-xs">Manager</Badge>
          </>
        ) : (
          <span className="text-xs text-gray-300 italic">Belum ada manager</span>
        )}
      </div>

      <div className="flex items-center justify-end mt-2 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium">Kelola</span>
        <ChevronRight size={14} />
      </div>
    </button>
  )
}

export default function ProjectListPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchProjects = async () => {
    setLoading(true)
    const [
      { data: projectsData },
      { data: units },
      { data: allProfiles },
    ] = await Promise.all([
      supabase.from('projects').select('*, manager:manager_id(full_name)').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('units').select('id, project_id, status'),
      supabase.from('profiles').select('id, project_ids').in('role', ['marketing', 'manager']),
    ])

    const enriched = (projectsData || []).map((p) => {
      const pUnits = (units || []).filter((u) => u.project_id === p.id)
      const teamMembers = (allProfiles || []).filter((pr) => (pr.project_ids || []).includes(p.id))
      return {
        ...p,
        _unitCount: pUnits.length,
        _availableCount: pUnits.filter((u) => u.status === 'available').length,
        _teamCount: teamMembers.length,
        _managerName: p.manager?.full_name || null,
      }
    })
    setProjects(enriched)
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  const generateBookingCode = (name) => {
    const year = new Date().getFullYear().toString().slice(-2)
    const initials = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').join('')
    return (initials + year).slice(0, 8) || `PRJ${year}`
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama proyek wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .insert({
          name: form.name.trim(),
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          owner_id: user.id,
          status: 'active',
          booking_code: generateBookingCode(form.name.trim()),
        })
        .select()
        .single()
      if (err) throw err
      setShowModal(false)
      setForm(EMPTY_FORM)
      navigate(`/projects/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageWrapper
      title="Daftar Proyek"
      subtitle={`${projects.length} proyek`}
      actions={
        <Button size="sm" onClick={() => { setError(''); setShowModal(true) }}>
          <Plus size={16} /> Tambah Proyek
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-48 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FolderOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada proyek</p>
          <p className="text-xs mt-1 mb-4">Buat proyek pertama untuk mulai mengelola unit dan tim</p>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Buat Proyek Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(EMPTY_FORM); setError('') }}
        title="Tambah Proyek Baru"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleCreate} loading={saving}>Buat Proyek</Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nama Proyek <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Grand Village Cirebon"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lokasi <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Cirebon, Jawa Barat"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Perumahan dengan konsep modern..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}
