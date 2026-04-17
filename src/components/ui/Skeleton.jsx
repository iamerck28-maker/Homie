function SkeletonBox({ className = '' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
}

// ─── Tabel / List ─────────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} className={`h-3 flex-1 ${i === 0 ? 'max-w-[140px]' : ''}`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex gap-6 border-b border-gray-50 last:border-0 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className={`flex-1 ${j === 0 ? 'max-w-[140px]' : ''}`}>
              <SkeletonBox className={`h-3 ${j === 0 ? 'w-4/5 mb-1.5' : 'w-3/4'}`} />
              {j === 0 && <SkeletonBox className="h-2.5 w-3/5 bg-gray-100" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Detail / Form ────────────────────────────────────────────────────────────
export function DetailSkeleton({ cards = 2, rows = 5 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
          <SkeletonBox className="h-4 w-32 mb-5" />
          <div className="space-y-4">
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <SkeletonBox className="h-3 w-24 bg-gray-100" />
                <SkeletonBox className="h-3 w-28 bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function DashboardSkeleton({ statCount = 4, tableRows = 5 }) {
  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${statCount === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-3 w-24 bg-gray-100" />
                <SkeletonBox className="h-7 w-16" />
                <SkeletonBox className="h-2.5 w-20 bg-gray-100" />
              </div>
              <SkeletonBox className="w-10 h-10 rounded-xl bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
      <TableSkeleton rows={tableRows} cols={4} />
    </div>
  )
}

// ─── Kanban / Pipeline ────────────────────────────────────────────────────────
export function KanbanSkeleton({ cols = 5 }) {
  const cardCounts = [3, 2, 4, 1, 2]
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <SkeletonBox className="h-3.5 w-20" />
            <SkeletonBox className="h-5 w-6 rounded-full bg-gray-100" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: cardCounts[i % cardCounts.length] }).map((_, j) => (
              <div key={j} className="bg-white rounded-lg p-3 border border-gray-100">
                <SkeletonBox className="h-3 w-4/5 mb-2" />
                <SkeletonBox className="h-2.5 w-3/5 bg-gray-100 mb-2" />
                <SkeletonBox className="h-5 w-14 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
