import { useState, useMemo } from 'react'
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Input from '../../components/ui/Input'
import { formatRupiah } from '../../lib/utils'

const BANK_PRESETS = [
  { name: 'BCA', rate: 7.5 },
  { name: 'BRI', rate: 7.75 },
  { name: 'Mandiri', rate: 7.5 },
  { name: 'BNI', rate: 7.25 },
  { name: 'BTN', rate: 7.99 },
  { name: 'CIMB', rate: 8.0 },
]

function StatBox({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-100'}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? 'text-primary-100' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function KprCalculatorPage() {
  const [form, setForm] = useState({
    harga: '',
    dp_persen: '20',
    bunga: '7.5',
    tenor: '20',
  })
  const [showTable, setShowTable] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const harga = parseFloat(form.harga.replace(/\D/g, '')) || 0
  const dpPersen = parseFloat(form.dp_persen) || 0
  const bunga = parseFloat(form.bunga) || 0
  const tenor = parseInt(form.tenor) || 0

  const result = useMemo(() => {
    if (!harga || !bunga || !tenor) return null
    const dp = Math.round((dpPersen / 100) * harga)
    const pokok = harga - dp
    const bungaBulanan = bunga / 100 / 12
    const n = tenor * 12
    const angsuran = pokok * (bungaBulanan * Math.pow(1 + bungaBulanan, n)) / (Math.pow(1 + bungaBulanan, n) - 1)
    const totalBayar = angsuran * n
    const totalBunga = totalBayar - pokok
    return { dp, pokok, angsuran: Math.round(angsuran), totalBayar: Math.round(totalBayar), totalBunga: Math.round(totalBunga), n }
  }, [harga, dpPersen, bunga, tenor])

  // Tabel angsuran per tahun
  const yearlyTable = useMemo(() => {
    if (!result) return []
    const { pokok, angsuran, n } = result
    const bungaBulanan = bunga / 100 / 12
    const rows = []
    let sisaPokok = pokok
    for (let year = 1; year <= tenor; year++) {
      let totalBungaTahun = 0
      let totalPokokTahun = 0
      for (let m = 0; m < 12; m++) {
        const bungaBulan = sisaPokok * bungaBulanan
        const pokokBulan = angsuran - bungaBulan
        totalBungaTahun += bungaBulan
        totalPokokTahun += pokokBulan
        sisaPokok -= pokokBulan
        if (sisaPokok < 0) sisaPokok = 0
      }
      rows.push({
        year,
        angsuranTahun: angsuran * 12,
        totalBungaTahun: Math.round(totalBungaTahun),
        totalPokokTahun: Math.round(totalPokokTahun),
        sisaPokok: Math.round(Math.max(0, sisaPokok)),
      })
    }
    return rows
  }, [result, tenor, bunga])

  const formatInput = (val) => {
    const num = val.replace(/\D/g, '')
    return num ? parseInt(num).toLocaleString('id-ID') : ''
  }

  return (
    <PageWrapper
      title="Kalkulator Simulasi KPR"
      subtitle="Hitung estimasi angsuran dan total pembayaran KPR"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Input */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calculator size={18} className="text-primary-600" />
              Parameter KPR
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga Properti (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatInput(form.harga)}
                onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value.replace(/\D/g, '') }))}
                placeholder="cth: 500.000.000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Uang Muka — {form.dp_persen}%
                {harga > 0 && (
                  <span className="text-gray-400 font-normal ml-1">
                    ({formatRupiah(Math.round((parseFloat(form.dp_persen) / 100) * harga))})
                  </span>
                )}
              </label>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={form.dp_persen}
                onChange={set('dp_persen')}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span><span>30%</span><span>60%</span><span>90%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suku Bunga Bank</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {BANK_PRESETS.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, bunga: String(b.rate) }))}
                    className={`px-2.5 py-1 text-xs rounded-full border font-medium transition-colors ${
                      parseFloat(form.bunga) === b.rate
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {b.name} {b.rate}%
                  </button>
                ))}
              </div>
              <Input
                type="number"
                step="0.01"
                min="1"
                max="30"
                value={form.bunga}
                onChange={set('bunga')}
                placeholder="cth: 7.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenor — {form.tenor} tahun
              </label>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={form.tenor}
                onChange={set('tenor')}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 th</span><span>10 th</span><span>20 th</span><span>30 th</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hasil */}
        <div className="lg:col-span-3 space-y-5">
          {!result ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Calculator size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Isi harga properti untuk melihat simulasi</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <StatBox label="Angsuran per Bulan" value={formatRupiah(result.angsuran)} highlight />
                <StatBox label="Uang Muka (DP)" value={formatRupiah(result.dp)} />
                <StatBox label="Total Pinjaman" value={formatRupiah(result.pokok)} />
                <StatBox label="Total Bunga" value={formatRupiah(result.totalBunga)} />
              </div>

              {/* Total */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Pembayaran (DP + {tenor} tahun cicilan)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(result.dp + result.totalBayar)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{tenor * 12} kali angsuran</p>
                    <p className="text-xs text-gray-400">Bunga {bunga}% / tahun</p>
                  </div>
                </div>
              </div>

              {/* Tabel Angsuran per Tahun */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowTable((v) => !v)}
                >
                  <span>Rincian Angsuran per Tahun</span>
                  {showTable ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showTable && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-center px-4 py-3 font-medium text-gray-600">Tahun</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Cicilan/Thn</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Bayar Pokok</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Bayar Bunga</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-600">Sisa Pinjaman</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {yearlyTable.map((row) => (
                          <tr key={row.year} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-center text-gray-700 font-medium">{row.year}</td>
                            <td className="px-4 py-2.5 text-right text-gray-700">{formatRupiah(row.angsuranTahun)}</td>
                            <td className="px-4 py-2.5 text-right text-green-700">{formatRupiah(row.totalPokokTahun)}</td>
                            <td className="px-4 py-2.5 text-right text-orange-600">{formatRupiah(row.totalBungaTahun)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">{formatRupiah(row.sisaPokok)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
