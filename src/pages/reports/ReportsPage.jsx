import { useState } from 'react'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Select } from '../../components/ui/Input'
import { useBookings } from '../../hooks/useBookings'
import { useProspects } from '../../hooks/useProspects'
import { useProjects } from '../../hooks/useProjects'
import { useKpr } from '../../hooks/useKpr'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { formatRupiah } from '../../lib/utils'
import {
  exportBookingsPDF, exportBookingsExcel,
  exportProspectsPDF, exportProspectsExcel,
  exportCommissionsPDF, exportCommissionsExcel,
  exportKprPDF, exportKprExcel,
} from '../../lib/export'

export default function ReportsPage() {
  const { role } = useAuthStore()
  const { projects } = useProjects()
  const [selectedProject, setSelectedProject] = useState('')
  const { bookings, loading: loadingBookings } = useBookings(selectedProject || null)
  const { prospects, loading: loadingProspects } = useProspects(selectedProject || null)
  const { kprList, loading: loadingKpr } = useKpr()
  const [loadingCommissions, setLoadingCommissions] = useState(false)
  const [commissions, setCommissions] = useState(null)

  const projectName = projects.find((p) => p.id === selectedProject)?.name || 'Semua Project'

  const loadCommissions = async () => {
    if (commissions) return commissions
    setLoadingCommissions(true)
    const { data } = await supabase
      .from('commissions')
      .select(`
        *,
        marketing:profiles!commissions_marketing_id_fkey(full_name),
        booking:bookings(buyer_name, unit:units(nomor, tipe, harga))
      `)
      .order('created_at', { ascending: false })
    setLoadingCommissions(false)
    setCommissions(data || [])
    return data || []
  }

  const totalRevenue = bookings.reduce((s, b) => s + (b.unit?.harga || 0), 0)
  const totalClosing = bookings.length
  const totalProspects = prospects.length
  const closingRate = totalProspects > 0 ? Math.round((totalClosing / totalProspects) * 100) : 0

  const reportCards = [
    {
      title: 'Laporan Booking',
      description: `${totalClosing} booking`,
      value: formatRupiah(totalRevenue),
      loading: loadingBookings,
      actions: [
        { label: 'PDF', icon: <FileText size={14} />, onClick: () => exportBookingsPDF(bookings, projectName) },
        { label: 'Excel', icon: <FileSpreadsheet size={14} />, onClick: () => exportBookingsExcel(bookings, projectName) },
      ],
    },
    {
      title: 'Laporan Prospek',
      description: `${totalProspects} prospek · closing rate ${closingRate}%`,
      value: null,
      loading: loadingProspects,
      actions: [
        { label: 'PDF', icon: <FileText size={14} />, onClick: () => exportProspectsPDF(prospects, projectName) },
        { label: 'Excel', icon: <FileSpreadsheet size={14} />, onClick: () => exportProspectsExcel(prospects, projectName) },
      ],
    },
    {
      title: 'Laporan KPR',
      description: `${kprList.length} pengajuan`,
      value: null,
      loading: loadingKpr,
      actions: [
        { label: 'PDF', icon: <FileText size={14} />, onClick: () => exportKprPDF(kprList, projectName) },
        { label: 'Excel', icon: <FileSpreadsheet size={14} />, onClick: () => exportKprExcel(kprList) },
      ],
    },
    ...(role !== 'marketing' ? [{
      title: 'Laporan Komisi',
      description: 'Rekap komisi sales',
      value: null,
      loading: loadingCommissions,
      actions: [
        {
          label: 'PDF', icon: <FileText size={14} />,
          onClick: async () => { const d = await loadCommissions(); exportCommissionsPDF(d, projectName) },
        },
        {
          label: 'Excel', icon: <FileSpreadsheet size={14} />,
          onClick: async () => { const d = await loadCommissions(); exportCommissionsExcel(d) },
        },
      ],
    }] : []),
  ]

  return (
    <PageWrapper title="Export Laporan" subtitle="Download data dalam format PDF atau Excel">
      {/* Filter project */}
      <div className="mb-6 max-w-xs">
        <Select label="Filter Project" value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}>
          <option value="">Semua Project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-400 mt-0.5">{card.description}</p>
                {card.value && (
                  <p className="text-lg font-bold text-primary-600 mt-2">{card.value}</p>
                )}
              </div>
              <div className="p-2 bg-primary-50 rounded-lg">
                <Download size={18} className="text-primary-600" />
              </div>
            </div>

            {card.loading ? (
              <div className="flex justify-center py-2"><LoadingSpinner size="sm" text="" /></div>
            ) : (
              <div className="flex gap-2">
                {card.actions.map((action) => (
                  <Button key={action.label} size="sm" variant="outline"
                    onClick={action.onClick} className="flex-1">
                    {action.icon} {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageWrapper>
  )
}
