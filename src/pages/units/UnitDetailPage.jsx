import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Building2, Trash2 } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatRupiah, formatDate, UNIT_STATUS_LABELS, getUnitStatusColor } from '../../lib/utils'

const statusVariants = {
  available: 'success',
  hold: 'warning',
  indent: 'info',
  sold: 'danger',
}

export default function UnitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuthStore()
  const [unit, setUnit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({})

  const fetchUnit = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('units')
      .select('*, projects(name, location)')
      .eq('id', id)
      .single()

    if (!error) {
      setUnit(data)
      setForm({
        cluster: data.cluster || '',
        blok: data.blok || '',
        nomor: data.nomor,
        tipe: data.tipe || '',
        luas_tanah: data.luas_tanah || '',
        luas_bangunan: data.luas_bangunan || '',
        harga: data.harga,
        status: data.status,
        notes: data.notes || '',
      })
    }
    setLoading(false)
  }

  useEffect(() => { fetchUnit() }, [id])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const { error } = await supabase
        .from('units')
        .update({
          ...form,
          harga: parseFloat(form.harga),
          luas_tanah: form.luas_tanah ? parseFloat(form.luas_tanah) : null,
          luas_bangunan: form.luas_bangunan ? parseFloat(form.luas_bangunan) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      await fetchUnit()
      setShowEditModal(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('units').delete().eq('id', id)
    setDeleting(false)
    if (!error) navigate('/units')
  }

  if (loading) return <PageWrapper><DetailSkeleton /></PageWrapper>
  if (!unit) return <PageWrapper><p className="text-gray-500">Unit tidak ditemukan</p></PageWrapper>

  return (
    <PageWrapper
      title={`Unit ${unit.nomor}`}
      subtitle={unit.projects?.name}
      actions={
        role !== 'marketing' && (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowEditModal(true)}>
              <Edit2 size={14} /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={14} /> Hapus
            </Button>
          </div>
        )
      }
    >
      <Link to="/units" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={16} /> Kembali ke daftar unit
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Informasi Unit</h3>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Project', value: unit.projects?.name },
              { label: 'Cluster', value: unit.cluster || '-' },
              { label: 'Blok', value: unit.blok || '-' },
              { label: 'Nomor', value: unit.nomor },
              { label: 'Tipe', value: unit.tipe || '-' },
              { label: 'Luas Tanah', value: unit.luas_tanah ? `${unit.luas_tanah} m²` : '-' },
              { label: 'Luas Bangunan', value: unit.luas_bangunan ? `${unit.luas_bangunan} m²` : '-' },
              { label: 'Harga', value: formatRupiah(unit.harga) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-900">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Status</dt>
              <dd><Badge variant={statusVariants[unit.status]}>{UNIT_STATUS_LABELS[unit.status]}</Badge></dd>
            </div>
          </dl>
        </div>

        {unit.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Catatan</h3>
            <p className="text-sm text-gray-600">{unit.notes}</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Hapus Unit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Batal</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus unit <strong>{unit.nomor}</strong>? Tindakan ini tidak bisa dibatalkan.
        </p>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setFormError('') }}
        title="Edit Unit"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Batal</Button>
            <Button onClick={handleUpdate} loading={formLoading}>Simpan</Button>
          </>
        }
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}
          <div className="grid grid-cols-3 gap-4">
            <Input label="Cluster" value={form.cluster} onChange={(e) => setForm({ ...form, cluster: e.target.value })} />
            <Input label="Blok" value={form.blok} onChange={(e) => setForm({ ...form, blok: e.target.value })} />
            <Input label="Nomor" required value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} />
          </div>
          <Input label="Tipe" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Luas Tanah (m²)" type="number" value={form.luas_tanah} onChange={(e) => setForm({ ...form, luas_tanah: e.target.value })} />
            <Input label="Luas Bangunan (m²)" type="number" value={form.luas_bangunan} onChange={(e) => setForm({ ...form, luas_bangunan: e.target.value })} />
          </div>
          <Input label="Harga (Rp)" required type="number" value={form.harga} onChange={(e) => setForm({ ...form, harga: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.entries(UNIT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Textarea label="Catatan" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </form>
      </Modal>
    </PageWrapper>
  )
}
