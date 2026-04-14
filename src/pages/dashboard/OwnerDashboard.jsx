import { useState, useEffect } from 'react'
import { Building2, TrendingUp, CreditCard, Users, ChevronDown } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      setProjects(projectsData || [])

      // Fetch units
      let unitQuery = supabase.from('units').select('id, status, harga, project_id, projects(name, manager_id)')
      if (selectedProject !== 'all') unitQuery = unitQuery.eq('project_id', selectedProject)
      const { data: units } = await unitQuery

      // Fetch KPR
      const { data: kpr } = await supabase.from('kpr_tracking').select('id, status')

      // Fetch prospects
      let prospectQuery = supabase.from('prospects').select('id, status, project_id')
      if (selectedProject !== 'all') prospectQuery = prospectQuery.eq('project_id', selectedProject)
      const { data: prospects } = await prospectQuery

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

  if (loading) return <PageWrapper title="Dashboard Owner"><LoadingSpinner /></PageWrapper>

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
    </PageWrapper>
  )
}
