import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, ClipboardList } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useBookings } from '../../hooks/useBookings'
import { formatDate, formatRupiah, PAYMENT_METHOD_LABELS } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

const paymentVariants = {
  kpr: 'info',
  cash: 'success',
  cash_bertahap: 'purple',
}

export default function BookingListPage() {
  const { role } = useAuthStore()
  const { bookings, loading, error } = useBookings()
  const [search, setSearch] = useState('')
  const [filterPayment, setFilterPayment] = useState('')

  const filtered = bookings.filter((b) => {
    const matchPayment = !filterPayment || b.payment_method === filterPayment
    const matchSearch =
      !search ||
      b.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.unit?.nomor?.includes(search)
    return matchPayment && matchSearch
  })

  return (
    <PageWrapper
      title="Daftar Booking"
      subtitle="Kelola booking dan generate SPR"
      actions={
        <Button size="sm" as={Link} to="/bookings/new">
          <Plus size={16} /> Booking Baru
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Cari nama pembeli atau nomor unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Semua Pembayaran</option>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
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
          icon={<ClipboardList size={48} />}
          title="Belum ada booking"
          description="Buat booking baru setelah prospek closing"
          action={<Button as={Link} to="/bookings/new" size="sm"><Plus size={16} /> Booking Baru</Button>}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pembeli</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Pembayaran</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Booking Fee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">SPR</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.buyer_name}</p>
                      <p className="text-xs text-gray-400">{b.buyer_phone || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.unit ? `Unit ${b.unit.nomor}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.project?.name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={paymentVariants[b.payment_method]}>
                        {PAYMENT_METHOD_LABELS[b.payment_method] || '-'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatRupiah(b.booking_fee)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.booking_date)}</td>
                    <td className="px-4 py-3 text-center">
                      {b.spr_generated_at ? (
                        <Badge variant="success">Sudah</Badge>
                      ) : (
                        <Badge variant="default">Belum</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/bookings/${b.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-medium">
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
