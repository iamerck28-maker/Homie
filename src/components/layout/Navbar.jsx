import { useState } from 'react'
import { LogOut, Bell, ChevronDown, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../lib/utils'

export default function Navbar({ onMobileMenuToggle }) {
  const { profile, role, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const roleLabel = {
    owner: 'Owner',
    manager: 'Manager Marketing',
    marketing: 'Marketing',
  }

  const roleBadgeColor = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    marketing: 'bg-green-100 text-green-700',
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={18} />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {getInitials(profile?.full_name)}
              </span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">{profile?.full_name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColor[role]}`}>
                {roleLabel[role]}
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                  <p className="text-xs text-gray-500">{roleLabel[role]}</p>
                </div>
                <button
                  onClick={() => { logout(); setShowDropdown(false) }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
