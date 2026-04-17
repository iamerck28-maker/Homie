import { useState, useEffect } from 'react'
import { Building2, TrendingUp, CreditCard, Users, ChevronDown, Megaphone } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/utils'
import { DashboardSkeleton } from '../../components/ui/Skeleton'

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('all')
  const [stats, setStats] = useState(null)
  const [projectStats, setProjectStats] = useState([])
  const [kprStats, setKprStats] = useState({})
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buat semua query dulu (belum await)
      let unitQuery = supabase.from('units').select('id, status, harga, project_id, projects(name, manager_id)')
      if (selectedProject !== 'all') unitQuery = unitQuery.eq('project_id', selectedProject)

      let prospectQuery = supabase.from('prospects').select('id, status, project_id')
      if (selectedProject !== 'all') prospectQuery = prospectQuery.eq('project_id', selectedProject)

      let campaignQuery = supabase
        .from('campaigns')
        .select(`*, prospects(id, bookings(id, unit:units(harga)))`)
        .order('created_at', { ascending: false })
      if (selectedProject !== 'all') campaignQuery = campaignQuery.eq('project_id', selectedProject)

      // Semua query dijalankan paralel
      const [
        { data: projectsData },
        { data: units },
        { data: kpr },
        { data: prospects },
        { data: campaignData },
      ] = await Promise.all([
        supabase.from('projects').select('*').order('name'),
        unitQuery,
        supabase.from('kpr_tracking').select('id, status'),
        prospectQuery,
        campaignQuery,
      ])

      setProjects(projectsData || [])

      const totalUnits = (units || []).length
      const soldUnits = (units || []).filter((u) => u.status === 'sold').length
      const availableUnits = (units || []).filter((u) => u.status === 'available').length
      const revenue = (units || [])
        .filter((u) => u.status === 'sold')
        .reduce((sum, u) => sum + (u.harga || 0), 0)

      setStats({
        totalUnits,
        soldUnits,
        availableUnits,
        revenue,
        totalProspects: (prospects || []).length,
        closingProspects: (prospects || []).filter((p) => p.status === 'closing').length,
      })

      setKprStats({
        pending: (kpr || []).filter((k) => !['cair', 'ditolak'].includes(k.status)).length,
        akad: (kpr || []).filter((k) => k.status === 'akad').length,
        cair: (kpr || []).filter((k) => k.status === 'cair').length,
        ditolak: (kpr || []).filter((k) => k.status === 'ditolak').length,
      })
      const enrichedCampaigns = (campaignData || []).map((c) => {
        const leads = c.prospects?.length || 0
        const closings = c.prospects?.filter((p) => p.bookings?.length > 0).length || 0
        const revenue = c.prospects?.reduce((sum, p) =>
          sum + (p.bookings?.reduce((s2, b) => s2 + (b.unit?.harga || 0), 0) || 0), 0) || 0
        const roi = c.budget > 0 ? Math.round(((revenue - c.budget) / c.budget) * 100) : null
        return { ...c, _leads: leads, _closings: closings, _revenue: revenue, _roi: roi }
      })
      setCampaigns(enrichedCampaigns)

      // Per project stats
      if (selectedProject === 'all' && projectsData) {
        const perProject = projectsData.map((p) => {
          const pUnits = (units || []).filter((u) => u.project_id === p.id)
          const pProspects = (prospects || []).filter((pr) => pr.project_id === p.id)
          return {
            name: p.name,
            location: p.location,
            total: pUnits.length,
            sold: pUnits.filter((u) => u.status === 'sold').length,
            available: pUnits.filter((u) => u.status === 'available').length,
            revenue: pUnits.filter((u) => u.status === 'sold').reduce((s, u) => s + (u.harga || 0), 0),
            prospects: pProspects.length,
            closing: pProspects.filter((pr) => pr.status === 'closing').length,
          }
        })
        setProjectStats(perProject)
      }
    } catch (err) {
      console.error('Owner dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageWrapper title="Dashboard Owner"><DashboardSkeleton /></PageWrapper>

  return (
    <PageWrapper
      title="Dashboard Owner"
      subtitle="Konsolidasi seluruh project properti"
      actions={
        <div className="relative">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Semua Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Unit" value={stats?.totalUnits || 0} subtitle={`${stats?.availableUnits || 0} tersedia`} icon={Building2} />
        <StatCard title="Unit Terjual" value={stats?.soldUnits || 0} icon={TrendingUp} />
        <StatCard title="Total Revenue" value={formatRupiah(stats?.revenue || 0)} icon={Building2} />
        <StatCard title="Total Prospek" value={stats?.totalProspects || 0} subtitle={`${stats?.closingProspects || 0} closing`} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPR Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Status KPR Global</h3>
          <div className="space-y-3">
            {[
              { label: 'Proses', value: kprStats.pending || 0, color: 'text-blue-600' },
              { label: 'Akad', value: kprStats.akad || 0, color: 'text-orange-600' },
              { label: 'Cair', value: kprStats.cair || 0, color: 'text-green-600' },
              { label: 'Ditolak', value: kprStats.ditolak || 0, color: 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project comparison */}
        {selectedProject === 'all' && (
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Perbandingan Project</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium text-right">Unit</th>
                    <th className="pb-3 font-medium text-right">Terjual</th>
                    <th className="pb-3 font-medium text-right">Prospek</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projectStats.map((p, i) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="py-3 text-right text-gray-600">{p.total}</td>
                      <td className="py-3 text-right text-gray-600">{p.sold}</td>
                      <td className="py-3 text-right text-gray-600">{p.prospects}</td>
                      <td className="py-3 text-right text-gray-600">{formatRupiah(p.revenue)}</td>
                    </tr>
                  ))}
                  {projectStats.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Belum ada data project</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Campaign Analytics */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Megaphone size={16} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Campaign Analytics</h3>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Belum ada data campaign</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium text-right">Budget</th>
                  <th className="pb-3 font-medium text-right">Leads</th>
                  <th className="pb-3 font-medium text-right">Closing</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3">
                      <Badge variant="default" size="sm">{c.channel?.replace('_', ' ')}</Badge>
                    </td>
                    <td className="py-3 text-right text-gray-600">{c.budget ? formatRupiah(c.budget) : '-'}</td>
                    <td className="py-3 text-right text-gray-600">{c._leads}</td>
                    <td className="py-3 text-right text-gray-600">{c._closings}</td>
                    <td className="py-3 text-right text-gray-600">{formatRupiah(c._revenue)}</td>
                    <td className={`py-3 text-right font-semibold ${c._roi === null ? 'text-gray-400' : c._roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {c._roi !== null ? `${c._roi}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
