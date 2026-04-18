import { useState } from 'react'
import { Plus, Search, Building2, Upload } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import UnitImportModal from '../../components/units/UnitImportModal'
import { useUnits } from '../../hooks/useUnits'
import useAuthStore from '../../store/authStore'
import { formatRupiah, UNIT_STATUS_LABELS, getUnitStatusColor } from '../../lib/utils'
import { Link } from 'react-router-dom'

const statusVariants = {
  available: 'success',
  hold: 'warning',
  indent: 'info',
  sold: 'danger',
}

export default function UnitListPage() {
  const { role, activeProject, projects } = useAuthStore()
  const { units, loading, error, addUnit, bulkAddUnits } = useUnits(activeProject?.id ?? null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    project_id: '',
    cluster: '',
    blok: '',
    nomor: '',
    tipe: '',
    luas_tanah: '',
    luas_bangunan: '',
    harga: '',
    notes: '',
  })

  const filtered = units.filter((u) => {
    const matchStatus = !filterStatus || u.status === filterStatus
    const matchSearch =
      !search ||
      u.nomor?.toLowerCase().includes(search.toLowerCase()) ||
      u.cluster?.toLowerCase().includes(search.toLowerCase()) ||
      u.blok?.toLowerCase().includes(search.toLowerCase()) ||
      u.tipe?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.nomor || !form.harga || !form.project_id) {
      setFormError('Project, nomor unit, dan harga wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      await addUnit({
        ...form,
        harga: parseFloat(form.harga),
        luas_tanah: form.luas_tanah ? parseFloat(form.luas_tanah) : null,
        luas_bangunan: form.luas_bangunan ? parseFloat(form.luas_bangunan) : null,
      })
      setShowAddModal(false)
      setForm({ project_id: '', cluster: '', blok: '', nomor: '', tipe: '', luas_tanah: '', luas_bangunan: '', harga: '', notes: '' })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <PageWrapper
      title="Stok Unit"
      subtitle="Kelola daftar unit per project"
      actions={
        role !== 'marketing' && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowImportModal(true)} size="sm">
              <Upload size={16} /> Import
            </Button>
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus size={16} /> Tambah Unit
            </Button>
          </div>
        )
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari nomor, cluster, blok..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Status</option>
          {Object.entries(UNIT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} />}
          title="Belum ada unit"
          description="Tambah unit baru untuk mulai mengelola stok"
          action={role !== 'marketing' && <Button onClick={() => setShowAddModal(true)} size="sm"><Plus size={16} /> Tambah Unit</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-center px-3 py-3 font-medium text-gray-400 w-10">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Cluster/Blok</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tipe</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nomor</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Luas (m²)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Harga</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((unit, idx) => (
                  <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-center text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {[unit.cluster, unit.blok].filter(Boolean).join(' / ') || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{unit.tipe || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{unit.nomor}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {unit.luas_bangunan ? `${unit.luas_bangunan} / ${unit.luas_tanah || '-'}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatRupiah(unit.harga)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={statusVariants[unit.status]}>
                        {UNIT_STATUS_LABELS[unit.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/units/${unit.id}`}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
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

      {/* Import Modal */}
      <UnitImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={bulkAddUnits}
        projectId={activeProject?.id || ''}
        projects={projects}
      />

      {/* Add Unit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormError('') }}
        title="Tambah Unit Baru"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Batal</Button>
            <Button onClick={handleAdd} loading={formLoading}>Simpan Unit</Button>
          </>
        }
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>
          )}
          <Select
            label="Project" required
            value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
          >
            <option value="">Pilih project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cluster" value={form.cluster} onChange={(e) => setForm({ ...form, cluster: e.target.value })} placeholder="A" />
            <Input label="Blok" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} placeholder="B" />
            <Input label="Nomor Unit" required value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} placeholder="01" />
          </div>
          <Input label="Tipe" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} placeholder="Type 36/72" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Luas Tanah (m²)" type="number" value={form.luas_tanah} onChange={(e) => setForm({ ...form, luas_tanah: e.target.value })} />
            <Input label="Luas Bangunan (m²)" type="number" value={form.luas_bangunan} onChange={(e) => setForm({ ...form, luas_bangunan: e.target.value })} />
          </div>
          <Input label="Harga (Rp)" required type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} placeholder="500000000" />
        </form>
      </Modal>
    </PageWrapper>
  )
}
