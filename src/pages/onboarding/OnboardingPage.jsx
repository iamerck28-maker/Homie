import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Building2, MapPin, ArrowRight, LogOut, SkipForward } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useAuthStore from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRoute } from '../../lib/utils'

const SKIP_KEY = 'homie_onboarding_skipped'
export const hasSkippedOnboarding = () => localStorage.getItem(SKIP_KEY) === '1'
export const setOnboardingSkipped = () => localStorage.setItem(SKIP_KEY, '1')
export const clearOnboardingSkipped = () => localStorage.removeItem(SKIP_KEY)

export default function OnboardingPage() {
  const { role, setCompanies, setActiveCompany } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama perusahaan wajib diisi'); return }

    setLoading(true)
    setError('')
    try {
      const { data, error: rpcError } = await supabase.rpc('create_company', {
        p_name: form.name.trim(),
        p_address: form.address.trim() || null,
      })
      if (rpcError) throw rpcError

      // Fetch company yang baru dibuat
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', data)
        .single()

      if (company) {
        setCompanies([company])
        setActiveCompany(company)
      }

      navigate(getDefaultRoute(role), { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center shadow-md">
            <Home size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Homie</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
              <Building2 size={22} className="text-primary-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Buat Perusahaan</h1>
            <p className="text-sm text-gray-500 mt-1">
              Selamat datang! Mulai dengan membuat profil perusahaan developer kamu.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nama Perusahaan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="PT. Griya Indah Nusantara"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alamat <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Jl. Sudirman No. 1, Jakarta Pusat"
                  rows={2}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Buat Perusahaan
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            onClick={() => { setOnboardingSkipped(); navigate(getDefaultRoute(role), { replace: true }) }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <SkipForward size={14} />
            Lewati — sudah punya proyek sebelumnya
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={14} />
            Keluar
          </button>
        </div>
      </div>
    </div>
  )
}
