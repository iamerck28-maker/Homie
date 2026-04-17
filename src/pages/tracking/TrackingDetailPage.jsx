import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Home, CheckCircle2, Circle, Clock, Download,
  AlertCircle, ChevronDown, ChevronUp, FileText, ClipboardList,
} from 'lucide-react'
import { fetchTrackingData } from '../../lib/supabase'
import { formatDate, formatRupiah, PAYMENT_METHOD_LABELS } from '../../lib/utils'

const KPR_DOCS = [
  'KTP Pemohon',
  'KTP Pasangan (jika ada)',
  'Surat Nikah / Cerai (jika berlaku)',
  'Slip Gaji / Surat Keterangan Penghasilan',
  'Rekening Koran 3 Bulan Terakhir',
  'NPWP',
]

// Label & config status KPR khusus konsumen
const KPR_STEPS = [
  { key: 'dokumen',   label: 'Pengumpulan Dokumen',   desc: 'Dokumen persyaratan KPR sedang dikumpulkan' },
  { key: 'ojk',       label: 'BI Checking',             desc: 'Riwayat kredit Anda sedang diperiksa oleh bank' },
  { key: 'appraisal', label: 'Appraisal',              desc: 'Bank sedang menilai harga unit yang Anda beli' },
  { key: 'sp3k',      label: 'SP3K',                   desc: 'Surat Persetujuan Prinsip Pemberian Kredit diterbitkan' },
  { key: 'akad',      label: 'Akad Kredit',            desc: 'Penandatanganan perjanjian kredit dengan bank' },
  { key: 'cair',      label: 'Disetujui',              desc: 'KPR telah disetujui dan dana siap dicairkan' },
]

const KPR_STATUS_ORDER = ['dokumen', 'ojk', 'appraisal', 'sp3k', 'akad', 'cair']

const HANDOVER_STATUS_LABELS = {
  scheduled:   'Dijadwalkan',
  done:        'Selesai',
  rescheduled: 'Dijadwal Ulang',
}

const HANDOVER_STATUS_COLORS = {
  scheduled:   'bg-yellow-100 text-yellow-700',
  done:        'bg-green-100 text-green-700',
  rescheduled: 'bg-orange-100 text-orange-700',
}

const PAYMENT_TYPE_LABELS = {
  dp:         'Down Payment',
  cicilan:    'Cicilan',
  pelunasan:  'Pelunasan',
  lainnya:    'Lainnya',
}

function SectionCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-semibold text-gray-900 text-sm">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function StatusDot({ done, active }) {
  if (done) return <CheckCircle2 size={20} className="text-green-500 shrink-0" />
  if (active) return <div className="w-5 h-5 rounded-full border-2 border-primary-500 bg-primary-100 shrink-0 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" /></div>
  return <Circle size={20} className="text-gray-200 shrink-0" />
}

export default function TrackingDetailPage() {
  const { code } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let mounted = true
    const doFetch = async () => {
      setLoading(true)
      const result = await fetchTrackingData(code?.toUpperCase())
      if (!mounted) return
      if (!result) {
        setNotFound(true)
      } else {
        setData(result)
      }
      setLoading(false)
    }
    doFetch()
    return () => { mounted = false }
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Memuat data transaksi...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Kode Akses Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Pastikan kode yang Anda masukkan benar.<br />
          Kode akses bersifat case-insensitive.
        </p>
        <Link
          to="/track"
          className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Coba Kode Lain
        </Link>
      </div>
    )
  }

  const { booking, unit, project, kpr, handover, payments, pascaclosing_items } = data

  // Hitung step KPR aktif
  const kprData = kpr?.[0] // ambil KPR pertama
  const currentStepIndex = kprData
    ? (kprData.status === 'ditolak' ? -1 : KPR_STATUS_ORDER.indexOf(kprData.status))
    : -1
  const isKprRejected = kprData?.status === 'ditolak'

  // Hitung total bayar
  const totalPaid = (payments || []).reduce((s, p) => s + (p.amount || 0), 0)
  const unitPrice = unit?.harga || 0
  const paymentPercent = unitPrice > 0 ? Math.min(100, Math.round((totalPaid / unitPrice) * 100)) : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
          <Home size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">Status Transaksi</p>
          <p className="text-sm font-bold text-gray-900 truncate">{booking?.buyer_name}</p>
        </div>
        <span className="text-xs font-mono font-semibold bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
          {code?.toUpperCase()}
        </span>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">

        {/* Info Unit & Project */}
        <SectionCard title="Informasi Unit">
          <div className="space-y-2.5 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 mb-3">
              <p className="text-xs text-gray-400 mb-0.5">Proyek</p>
              <p className="font-semibold text-gray-900">{project?.name || '-'}</p>
              {project?.location && <p className="text-xs text-gray-500 mt-0.5">{project.location}</p>}
            </div>
            {[
              { label: 'Unit', value: `Unit ${unit?.nomor || '-'}${unit?.blok ? ` Blok ${unit.blok}` : ''}${unit?.cluster ? ` · ${unit.cluster}` : ''}` },
              { label: 'Tipe', value: unit?.tipe || '-' },
              { label: 'Luas Tanah', value: unit?.luas_tanah ? `${unit.luas_tanah} m²` : '-' },
              { label: 'Luas Bangunan', value: unit?.luas_bangunan ? `${unit.luas_bangunan} m²` : '-' },
              { label: 'Harga Unit', value: formatRupiah(unit?.harga) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right ml-4">{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Info Booking */}
        <SectionCard title="Data Booking">
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Nama Pembeli', value: booking?.buyer_name },
              { label: 'No. HP', value: booking?.buyer_phone || '-' },
              { label: 'Email', value: booking?.buyer_email || '-' },
              { label: 'Tanggal Booking', value: formatDate(booking?.booking_date) },
              { label: 'Metode Pembelian', value: PAYMENT_METHOD_LABELS[booking?.payment_method] || '-' },
              { label: 'Booking Fee', value: formatRupiah(booking?.booking_fee) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right ml-4">{value}</span>
              </div>
            ))}
            {booking?.spr_url && (
              <div className="pt-2">
                <a
                  href={booking.spr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Download size={12} /> Unduh SPR
                </a>
              </div>
            )}
            {booking?.spr_generated_at && !booking?.spr_url && (
              <div className="flex justify-between">
                <span className="text-gray-500">SPR</span>
                <span className="text-xs text-green-600 font-medium">Sudah diterbitkan</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Riwayat Pembayaran */}
        {payments?.length > 0 && (
          <SectionCard title="Riwayat Pembayaran">
            <div className="space-y-3">
              {/* Progress bar */}
              {unitPrice > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Total Terbayar</span>
                    <span className="font-semibold text-gray-900">{paymentPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-primary-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${paymentPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1.5">
                    <span className="text-primary-700 font-medium">{formatRupiah(totalPaid)}</span>
                    <span className="text-gray-400">{formatRupiah(unitPrice)}</span>
                  </div>
                </div>
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatRupiah(p.amount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {PAYMENT_TYPE_LABELS[p.type] || p.type} · {formatDate(p.payment_date)}
                    </p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                    {p.payment_method}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* KPR Tracker */}
        {booking?.payment_method === 'kpr' && (
          <SectionCard title="Status KPR">
            {!kprData ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Clock size={16} />
                <span>Pengajuan KPR belum dibuka</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Bank</span>
                  <span className="font-semibold text-gray-900">{kprData.bank_name}</span>
                </div>

                {isKprRejected ? (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    <div>
                      <p className="font-medium">Pengajuan Ditolak</p>
                      {kprData.notes && <p className="text-xs mt-0.5 text-red-600">{kprData.notes}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {KPR_STEPS.map((step, i) => {
                      const done = i < currentStepIndex
                      const active = i === currentStepIndex
                      const isLast = i === KPR_STEPS.length - 1

                      // Tanggal relevan per step
                      let stepDate = null
                      if (step.key === 'sp3k' && kprData.sp3k_date) stepDate = kprData.sp3k_date
                      if (step.key === 'akad' && kprData.akad_date) stepDate = kprData.akad_date
                      if (step.key === 'dokumen' && kprData.submission_date) stepDate = kprData.submission_date

                      return (
                        <div key={step.key} className="flex gap-3">
                          {/* Line & dot */}
                          <div className="flex flex-col items-center">
                            <StatusDot done={done} active={active} />
                            {!isLast && (
                              <div className={`w-0.5 flex-1 my-1 rounded-full ${done ? 'bg-green-200' : 'bg-gray-100'}`} style={{ minHeight: 20 }} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`pb-4 flex-1 ${isLast ? '' : ''}`}>
                            <p className={`text-sm font-medium ${done ? 'text-gray-700' : active ? 'text-primary-700' : 'text-gray-300'}`}>
                              {step.label}
                            </p>
                            {active && (
                              <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                            )}
                            {stepDate && (
                              <p className="text-xs text-gray-400 mt-0.5">{formatDate(stepDate)}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )}
          </SectionCard>
        )}

        {/* Kelengkapan Dokumen KPR */}
        {booking?.payment_method === 'kpr' && kprData && (
          <SectionCard title="Kelengkapan Dokumen KPR">
            <div className="space-y-1">
              {(() => {
                const docs = kprData.documents_checklist || {}
                const doneDocs = KPR_DOCS.filter((d) => docs[d]).length
                const pct = Math.round((doneDocs / KPR_DOCS.length) * 100)
                return (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500">Dokumen diterima</span>
                        <span className="text-xs font-semibold text-gray-900">{doneDocs}/{KPR_DOCS.length}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {KPR_DOCS.map((doc) => (
                        <div key={doc} className="flex items-center gap-2.5">
                          {docs[doc]
                            ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                            : <Circle size={16} className="text-gray-200 shrink-0" />
                          }
                          <span className={`text-sm ${docs[doc] ? 'text-gray-700' : 'text-gray-400'}`}>{doc}</span>
                          {docs[doc] && <span className="ml-auto text-xs text-green-600 shrink-0">Diterima</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          </SectionCard>
        )}

        {/* Checklist Pasca-Closing */}
        {pascaclosing_items?.length > 0 && (
          <SectionCard title="Checklist Pasca-Closing">
            <div className="space-y-1">
              {(() => {
                const total = pascaclosing_items.length
                const done = pascaclosing_items.filter((i) => i.is_complete).length
                const pct = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <ClipboardList size={13} />
                        <span>Progress</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{done}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-primary-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })()}
              <div className="space-y-2.5">
                {pascaclosing_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5">
                    {item.is_complete
                      ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      : <Circle size={16} className="text-gray-200 shrink-0" />
                    }
                    <span className={`text-sm ${item.is_complete ? 'text-gray-700 line-through' : 'text-gray-500'}`}>
                      {item.item_name}
                    </span>
                    {item.is_complete && (
                      <span className="ml-auto text-xs text-green-600 shrink-0">Selesai</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Serah Terima */}
        <SectionCard title="Serah Terima Unit">
          {!handover ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Clock size={16} />
              <span>Jadwal serah terima belum ditentukan</span>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${HANDOVER_STATUS_COLORS[handover.status] || 'bg-gray-100 text-gray-600'}`}>
                  {HANDOVER_STATUS_LABELS[handover.status] || handover.status}
                </span>
              </div>
              {handover.scheduled_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal Rencana</span>
                  <span className="font-medium text-gray-900">{formatDate(handover.scheduled_date)}</span>
                </div>
              )}
              {handover.actual_date && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal Aktual</span>
                  <span className="font-medium text-gray-900">{formatDate(handover.actual_date)}</span>
                </div>
              )}
              {handover.defect_notes && (
                <div className="bg-orange-50 rounded-xl p-3 mt-2">
                  <p className="text-xs font-medium text-orange-700 mb-1">Catatan Defect</p>
                  <p className="text-xs text-orange-600 leading-relaxed">{handover.defect_notes}</p>
                </div>
              )}
              {handover.bast_url && (
                <div className="pt-1">
                  <a
                    href={handover.bast_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Download size={12} /> Unduh BAST
                  </a>
                </div>
              )}
              {handover.bast_generated_at && !handover.bast_url && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <FileText size={13} />
                  <span>BAST sudah diterbitkan</span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        Data diperbarui secara real-time · Kode: <span className="font-mono font-semibold">{code?.toUpperCase()}</span>
        <br />© {new Date().getFullYear()} Homie
      </footer>
    </div>
  )
}
