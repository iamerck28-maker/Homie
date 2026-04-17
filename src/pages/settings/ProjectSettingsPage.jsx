import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'

export default function ProjectSettingsPage() {
  const { profile } = useAuthStore()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', description: '', bank_name: '', bank_account_number: '', bank_account_name: '', booking_fee_default: '', booking_code: '' })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', profile?.id)

    setProjects(data || [])
    if (data?.length) {
      setSelectedProject(data[0])
      setForm({ name: data[0].name, location: data[0].location || '', description: data[0].description || '', bank_name: data[0].bank_name || '', bank_account_number: data[0].bank_account_number || '', bank_account_name: data[0].bank_account_name || '', booking_fee_default: data[0].booking_fee_default || '', booking_code: data[0].booking_code || '' })
    }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedProject) return
    setSaving(true)
    setSaveError('')
    try {
      const { error } = await supabase
        .from('projects')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', selectedProject.id)

      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await fetchProjects()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageWrapper title="Pengaturan Project"><DetailSkeleton /></PageWrapper>

  return (
    <PageWrapper title="Pengaturan Project" subtitle="Edit informasi project yang Anda kelola">
      {projects.length === 0 ? (
        <div className="text-sm text-gray-500">Anda belum mengelola project apapun.</div>
      ) : (
        <div className="max-w-lg">
          {projects.length > 1 && (
            <div className="mb-5">
              <select
                value={selectedProject?.id}
                onChange={(e) => {
                  const p = projects.find((p) => p.id === e.target.value)
                  setSelectedProject(p)
                  setForm({ name: p.name, location: p.location || '', description: p.description || '', bank_name: p.bank_name || '', bank_account_number: p.bank_account_number || '', bank_account_name: p.bank_account_name || '', booking_fee_default: p.booking_fee_default || '', booking_code: p.booking_code || '' })
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <form onSubmit={handleSave} className="space-y-4">
              {saveError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{saveError}</div>}
              {/* Link Form Booking */}
              {form.booking_code && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-2">
                  <p className="text-xs font-semibold text-primary-700 mb-2">Link Form Booking Konsumen</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-primary-900 bg-white border border-primary-200 px-2.5 py-1.5 rounded-lg flex-1 truncate">
                      {window.location.origin}/booking/{form.booking_code}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/booking/${form.booking_code}`)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="p-1.5 rounded-lg bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              )}

              <Input label="Nama Project" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kota, Provinsi" />
              <Textarea label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-3">Kode Booking</p>
                <Input
                  label="Kode Unik Project"
                  value={form.booking_code}
                  onChange={(e) => setForm({ ...form, booking_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="Contoh: GVC26"
                  maxLength={8}
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-3">Rekening Pembayaran Booking Fee</p>
                <div className="space-y-3">
                  <Input label="Nama Bank" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="BCA, BRI, Mandiri, dll" />
                  <Input label="Nomor Rekening" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} placeholder="1234567890" />
                  <Input label="Nama Pemilik Rekening" value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} placeholder="PT. ..." />
                  <Input label="Booking Fee Default (opsional)" type="number" value={form.booking_fee_default} onChange={(e) => setForm({ ...form, booking_fee_default: e.target.value })} placeholder="Nominal booking fee" />
                </div>
              </div>

              <Button type="submit" loading={saving} size="sm">
                {saved ? '✓ Tersimpan' : 'Simpan Perubahan'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
