import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Users, Target, DollarSign } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { useProjects } from '../../hooks/useProjects'
import { formatRupiah, formatDate } from '../../lib/utils'

const CHANNEL_LABELS = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  tiktok_ads: 'TikTok Ads',
  pameran: 'Pameran',
  referral: 'Referral',
  whatsapp: 'WhatsApp',
  website: 'Website',
  lainnya: 'Lainnya',
}

const CHANNEL_COLORS = {
  meta_ads: 'info',
  google_ads: 'danger',
  tiktok_ads: 'default',
  pameran: 'purple',
  referral: 'success',
  whatsapp: 'success',
  website: 'info',
  lainnya: 'default',
}

export default function CampaignPage() {
  const { profile, role } = useAuthStore()
  const { projects } = useProjects()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: '', channel: 'meta_ads', budget: '', project_id: '',
    start_date: '', end_date: '', notes: '',
  })

  useEffect(() => {
    let mounted = true
    fetchCampaigns(mounted)
    return () => { mounted = false }
  }, [selectedProject])

  const fetchCampaigns = async (mounted = true) => {
    setLoading(true)
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        project:projects(name),
        prospects(
          id, status,
          bookings(id, unit:units(harga))
        )
      `)
      .order('created_at', { ascending: false })

    if (selectedProject) query = query.eq('project_id', selectedProject)

    const { data } = await query
    if (!mounted) return

    // Hitung analytics per campaign
    const enriched = (data || []).map((c) => {
      const leads = c.prospects?.length || 0
      const closings = c.prospects?.filter((p) => p.bookings?.length > 0).length || 0
      const revenue = c.prospects?.reduce((sum, p) =>
        sum + (p.bookings?.reduce((s2, b) => s2 + (b.unit?.harga || 0), 0) || 0), 0) || 0
      const closingRate = leads > 0 ? Math.round((closings / leads) * 100) : 0
      const costPerLead = leads > 0 && c.budget ? Math.round(c.budget / leads) : 0
      const roi = c.budget > 0 ? Math.round(((revenue - c.budget) / c.budget) * 100) : null
      return { ...c, _leads: leads, _closings: closings, _revenue: revenue, _closingRate: closingRate, _costPerLead: costPerLead, _roi: roi }
    })

    setCampaigns(enriched)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.project_id) {
      setFormError('Nama campaign dan project wajib diisi')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const { error } = await supabase.from('campaigns').insert([{
        name: form.name,
        channel: form.channel,
        budget: form.budget ? parseFloat(form.budget) : null,
        project_id: form.project_id,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        created_by: profile?.id,
      }])
      if (error) throw error
      setShowModal(false)
      setForm({ name: '', channel: 'meta_ads', budget: '', project_id: '', start_date: '', end_date: '', notes: '' })
      fetchCampaigns()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  // Summary totals
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const totalLeads = campaigns.reduce((s, c) => s + c._leads, 0)
  const totalClosings = campaigns.reduce((s, c) => s + c._closings, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c._revenue, 0)

  return (
    <PageWrapper
      title="Campaign & Analytics"
      subtitle="ROI dan performa per sumber lead"
      actions={
        role === 'manager' && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Campaign Baru
          </Button>
        )
      }
    >
      {/* Filter */}
      <div className="mb-5 max-w-xs">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Budget', value: formatRupiah(totalBudget), icon: <DollarSign size={16} />, color: 'text-gray-700' },
          { label: 'Total Leads', value: totalLeads, icon: <Users size={16} />, color: 'text-blue-700' },
          { label: 'Total Closing', value: totalClosings, icon: <Target size={16} />, color: 'text-green-700' },
          { label: 'Total Revenue', value: formatRupiah(totalRevenue), icon: <TrendingUp size={16} />, color: 'text-primary-700' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`flex items-center gap-1.5 text-sm mb-1 ${color}`}>
              {icon} <span className="text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="Belum ada campaign"
          description="Buat campaign untuk mulai tracking ROI per sumber lead"
          action={role === 'manager' && <Button size="sm" onClick={() => setShowModal(true)}><Plus size={16} /> Campaign Baru</Button>}
        />
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <Badge variant={CHANNEL_COLORS[c.channel]}>{CHANNEL_LABELS[c.channel] || c.channel}</Badge>
                  </div>
                  <p className="text-xs text-gray-400">
                    {c.project?.name}
                    {c.start_date && ` · ${formatDate(c.start_date)}${c.end_date ? ` – ${formatDate(c.end_date)}` : ''}`}
                  </p>
                </div>
                {c.budget && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Budget</p>
                    <p className="font-semibold text-gray-900">{formatRupiah(c.budget)}</p>
                  </div>
                )}
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-gray-50">
                <Metric label="Total Leads" value={c._leads} />
                <Metric label="Closing" value={c._closings} />
                <Metric label="Closing Rate" value={`${c._closingRate}%`} highlight={c._closingRate >= 20} />
                <Metric label="Revenue" value={formatRupiah(c._revenue)} />
                <Metric
                  label="ROI"
                  value={c._roi !== null ? `${c._roi}%` : '-'}
                  highlight={c._roi > 0}
                  negative={c._roi !== null && c._roi < 0}
                />
              </div>

              {/* Cost per lead */}
              {c._costPerLead > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  Cost per lead: <span className="font-medium text-gray-600">{formatRupiah(c._costPerLead)}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setFormError('') }}
        title="Campaign Baru"
        size="md"
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
          <Input label="Nama Campaign" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="cth: Meta Ads Mei 2026" />
          <Select label="Project" required value={form.project_id}
            onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
            <option value="">Pilih project...</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Channel" value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value })}>
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Input label="Budget (Rp)" type="number" value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            placeholder="Opsional" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tanggal Mulai" type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="Tanggal Selesai" type="date" value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </form>
      </Modal>
    </PageWrapper>
  )
}

function Metric({ label, value, highlight = false, negative = false }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${negative ? 'text-red-600' : highlight ? 'text-green-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
