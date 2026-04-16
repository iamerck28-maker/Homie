import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Home } from 'lucide-react'

export default function TrackingPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Masukkan kode akses terlebih dahulu')
      return
    }
    if (!/^HOM\d{4}[A-Z]{3}$/.test(trimmed)) {
      setError('Format kode akses tidak valid. Contoh: HOM2604ABC')
      return
    }
    navigate(`/track/${trimmed}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <Home size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg">Homie</span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cek Progress Transaksi</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Masukkan kode akses yang Anda terima dari agen pemasaran untuk melihat status pembelian unit Anda.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kode Akses
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError('') }}
                  placeholder="Contoh: HOM2604ABC"
                  maxLength={10}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono font-semibold tracking-widest placeholder:text-gray-300 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all uppercase"
                  autoComplete="off"
                  autoFocus
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1.5">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Cek Status
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-50">
              <p className="text-center text-xs text-gray-400">
                Kode akses terdiri dari 10 karakter.<br />
                Hubungi agen pemasaran Anda jika belum menerima kode.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Homie · Platform Properti Indonesia
      </footer>
    </div>
  )
}
