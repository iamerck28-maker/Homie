import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Halaman tidak ditemukan</h1>
        <p className="text-gray-500 mb-8">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Home size={18} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
