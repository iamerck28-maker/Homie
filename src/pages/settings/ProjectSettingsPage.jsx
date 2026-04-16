import { useState, useEffect } from 'react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input, { Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
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
  const [form, setForm] = useState({ name: '', location: '', description: '' })

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
      setForm({ name: data[0].name, location: data[0].location || '', description: data[0].description || '' })
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

  if (loading) return <PageWrapper title="Pengaturan Project"><LoadingSpinner /></PageWrapper>

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
                  setForm({ name: p.name, location: p.location || '', description: p.description || '' })
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
              <Input label="Nama Project" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kota, Provinsi" />
              <Textarea label="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
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
