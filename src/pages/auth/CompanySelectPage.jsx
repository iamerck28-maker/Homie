import { useNavigate } from 'react-router-dom'
import { Building2, ChevronRight, Home, LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { getDefaultRoute } from '../../lib/utils'

export default function CompanySelectPage() {
  const { companies, setActiveCompany, role } = useAuthStore()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleSelect = (company) => {
    setActiveCompany(company)
    navigate(getDefaultRoute(role), { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm">
            <Home size={20} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Homie</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Pilih Perusahaan</h1>
          <p className="text-sm text-gray-500 mb-6">
            Akun kamu terhubung ke {companies.length} perusahaan. Pilih untuk melanjutkan.
          </p>

          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum terhubung ke perusahaan manapun.</p>
              <p className="text-xs mt-1">Hubungi admin untuk mendapatkan akses.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleSelect(company)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-primary-400 hover:bg-primary-50 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <Building2 size={18} className="text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{company.name}</p>
                    {company.address && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{company.address}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2 mx-auto text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>
    </div>
  )
}
