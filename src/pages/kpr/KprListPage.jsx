import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Search } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useKpr } from '../../hooks/useKpr'
import { formatDate, KPR_STATUS_LABELS, getKprStatusColor, isWithinDays } from '../../lib/utils'

const kprVariants = {
  dokumen: 'default',
  ojk: 'info',
  appraisal: 'purple',
  sp3k: 'warning',
  akad: 'orange',
  cair: 'success',
  ditolak: 'danger',
}

export default function KprListPage() {
  const { kprList, loading, error } = useKpr()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = kprList.filter((k) => {
    const matchStatus = !filterStatus || k.status === filterStatus
    const matchSearch =
      !search ||
      k.booking?.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      k.bank_name?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <PageWrapper title="KPR Tracker" subtitle="Pantau status pengajuan KPR per pembeli">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari nama pembeli atau bank..."
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
          {Object.entries(KPR_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={48} />}
          title="Belum ada pengajuan KPR"
          description="Pengajuan KPR dibuat dari halaman detail booking"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pembeli</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Bank</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal Pengajuan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Akad</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Dok.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((k) => {
                  const completeDocs = (k.kpr_documents || []).filter((d) => d.is_complete).length
                  const totalDocs = (k.kpr_documents || []).length
                  const hasNearExpiry = (k.kpr_documents || []).some((d) => d.due_date && isWithinDays(d.due_date, 7))

                  return (
                    <tr key={k.id} className={`hover:bg-gray-50 transition-colors ${hasNearExpiry ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{k.booking?.buyer_name || '-'}</p>
                        {hasNearExpiry && <p className="text-xs text-orange-600">⚠ Dokumen hampir expired</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {k.booking?.unit ? `Unit ${k.booking.unit.nomor}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{k.bank_name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={kprVariants[k.status]}>{KPR_STATUS_LABELS[k.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{k.submission_date ? formatDate(k.submission_date) : '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{k.akad_date ? formatDate(k.akad_date) : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${completeDocs === totalDocs && totalDocs > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {completeDocs}/{totalDocs}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/kpr/${k.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
