import { useState, useEffect } from 'react'
import { Users, Building2, TrendingUp, CreditCard, ArrowUp, ArrowDown } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/utils'
import { DashboardSkeleton } from '../../components/ui/Skeleton'

function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          <span>{Math.abs(trend)}% dari bulan lalu</span>
        </div>
      )}
    </div>
  )
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null)
  const [salesPerformance, setSalesPerformance] = useState([])
  const [pipeline, setPipeline] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

      // Semua query dijalankan paralel — tidak saling menunggu
      const [
        { data: prospectsThisMonth },
        { data: prospectsLastMonth },
        { data: allProspects },
        { data: units },
        { data: kprData },
      ] = await Promise.all([
        supabase.from('prospects').select('id, status, assigned_to').gte('created_at', startOfMonth),
        supabase.from('prospects').select('id, status').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth),
        supabase.from('prospects').select('id, status, assigned_to, profiles!prospects_assigned_to_fkey(full_name)'),
        supabase.from('units').select('id, status'),
        supabase.from('kpr_tracking').select('id, status'),
      ])

      // Calculate stats
      const closingThisMonth = (prospectsThisMonth || []).filter((p) => p.status === 'closing').length
      const closingLastMonth = (prospectsLastMonth || []).filter((p) => p?.status === 'closing').length

      const totalProspects = (prospectsThisMonth || []).length
      const lastMonthTotal = (prospectsLastMonth || []).length

      const closingRate = totalProspects > 0 ? Math.round((closingThisMonth / totalProspects) * 100) : 0

      // Pipeline by status
      const pipelineData = {}
      const statusList = ['new', 'followup', 'survey', 'negotiation', 'closing', 'cancel']
      statusList.forEach((s) => {
        pipelineData[s] = (allProspects || []).filter((p) => p.status === s).length
      })

      // Sales performance
      const salesMap = {}
      ;(allProspects || []).forEach((p) => {
        const name = p.profiles?.full_name || 'Unknown'
        const id = p.assigned_to
        if (!salesMap[id]) salesMap[id] = { name, total: 0, closing: 0 }
        salesMap[id].total++
        if (p.status === 'closing') salesMap[id].closing++
      })

      const salesList = Object.values(salesMap).map((s) => ({
        ...s,
        rate: s.total > 0 ? Math.round((s.closing / s.total) * 100) : 0,
      }))

      const unitStats = {
        available: (units || []).filter((u) => u.status === 'available').length,
        sold: (units || []).filter((u) => u.status === 'sold').length,
        hold: (units || []).filter((u) => u.status === 'hold').length,
        total: (units || []).length,
      }

      const kprPending = (kprData || []).filter((k) => !['cair', 'ditolak'].includes(k.status)).length
      const kprAkad = (kprData || []).filter((k) => k.status === 'akad').length

      setStats({
        prospectsThisMonth: totalProspects,
        prospectsLastMonth: lastMonthTotal,
        closingThisMonth,
        closingLastMonth,
        closingRate,
        unitStats,
        kprPending,
        kprAkad,
      })
      setPipeline(pipelineData)
      setSalesPerformance(salesList)
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const pipelineLabels = {
    new: 'Baru',
    followup: 'Follow-Up',
    survey: 'Survei',
    negotiation: 'Negosiasi',
    closing: 'Closing',
    cancel: 'Batal',
  }

  if (loading) return <PageWrapper title="Dashboard Manager"><DashboardSkeleton /></PageWrapper>

  return (
    <PageWrapper title="Dashboard Manager" subtitle="Ringkasan performa tim marketing">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Prospek Bulan Ini"
          value={stats?.prospectsThisMonth || 0}
          subtitle={`${stats?.prospectsLastMonth || 0} bulan lalu`}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Closing Bulan Ini"
          value={stats?.closingThisMonth || 0}
          subtitle={`${stats?.closingLastMonth || 0} bulan lalu`}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="Closing Rate"
          value={`${stats?.closingRate || 0}%`}
          subtitle="Keseluruhan tim"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="KPR Pending"
          value={stats?.kprPending || 0}
          subtitle={`${stats?.kprAkad || 0} akad bulan ini`}
          icon={CreditCard}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Pipeline Prospek</h3>
          <div className="space-y-3">
            {Object.entries(pipelineLabels).map(([status, label]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{pipeline[status] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Stok Unit</h3>
          <div className="space-y-3">
            {[
              { label: 'Tersedia', key: 'available', color: 'bg-green-500' },
              { label: 'Hold', key: 'hold', color: 'bg-yellow-500' },
              { label: 'Terjual', key: 'sold', color: 'bg-red-500' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-sm text-gray-600 flex-1">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.unitStats?.[key] || 0}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-sm font-bold text-gray-900">{stats?.unitStats?.total || 0}</span>
            </div>
          </div>
        </div>

        {/* Sales Performance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Performa Sales</h3>
          {salesPerformance.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>
          ) : (
            <div className="space-y-3">
              {salesPerformance.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-primary-700">{s.name?.[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.closing} closing / {s.total} prospek</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600">{s.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
