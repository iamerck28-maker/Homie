import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useProspects } from '../../hooks/useProspects'
import { formatRelativeDate, isOverdue, PROSPECT_STATUS_LABELS } from '../../lib/utils'

const columns = [
  { key: 'new', label: 'Baru', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { key: 'followup', label: 'Follow-Up', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { key: 'survey', label: 'Survei', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { key: 'negotiation', label: 'Negosiasi', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { key: 'closing', label: 'Closing', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
]

function ProspectCard({ prospect }) {
  return (
    <Link to={`/prospects/${prospect.id}`}>
      <div className="bg-white rounded-xl border border-gray-100 p-3.5 hover:shadow-md transition-shadow cursor-pointer">
        <p className="font-medium text-sm text-gray-900 mb-1">{prospect.full_name}</p>
        {prospect.unit && (
          <p className="text-xs text-gray-500 mb-1.5">
            Unit {prospect.unit.nomor} {prospect.unit.tipe && `- ${prospect.unit.tipe}`}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {prospect.assigned_to_profile?.full_name || 'Unassigned'}
          </span>
          {prospect.next_followup_at && (
            <span className={`text-xs font-medium ${isOverdue(prospect.next_followup_at) ? 'text-red-600' : 'text-gray-400'}`}>
              {formatRelativeDate(prospect.next_followup_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function PipelinePage() {
  const { prospects, loading, updateProspect } = useProspects()

  const getByStatus = (status) => prospects.filter((p) => p.status === status)

  const handleDragStart = (e, prospectId) => {
    e.dataTransfer.setData('prospectId', prospectId)
  }

  const handleDrop = async (e, newStatus) => {
    const prospectId = e.dataTransfer.getData('prospectId')
    if (!prospectId) return
    try {
      await updateProspect(prospectId, { status: newStatus })
    } catch (err) {
      console.error('Update status error:', err)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  if (loading) {
    return (
      <PageWrapper title="Pipeline Prospek">
        <LoadingSpinner />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Pipeline Prospek"
      subtitle="Drag & drop untuk pindah status"
      actions={
        <Button size="sm" as={Link} to="/prospects">
          List View
        </Button>
      }
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {columns.map((col) => {
          const items = getByStatus(col.key)
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-64 flex flex-col"
              onDrop={(e) => handleDrop(e, col.key)}
              onDragOver={handleDragOver}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl mb-3 ${col.color}`}>
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="text-sm font-bold">{items.length}</span>
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-2.5 min-h-[100px]">
                {items.map((prospect) => (
                  <div
                    key={prospect.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, prospect.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <ProspectCard prospect={prospect} />
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                    Tidak ada prospek
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PageWrapper>
  )
}
