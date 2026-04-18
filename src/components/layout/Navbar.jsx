import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, ChevronDown, Menu, Check, Trash2, BellOff, Building2, ArrowLeftRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useNotifications } from '../../hooks/useNotifications'
import { getInitials } from '../../lib/utils'
import useAuthStore from '../../store/authStore'

const TYPE_ICON = {
  booking: '📋',
  kpr: '🏦',
  prospect: '👤',
  commission: '💰',
  handover: '🏠',
  general: '📢',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export default function Navbar({ onMobileMenuToggle }) {
  const { profile, role, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const { companies, activeCompany, setActiveCompany } = useAuthStore()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showCompanyMenu, setShowCompanyMenu] = useState(false)
  const notifRef = useRef(null)
  const companyRef = useRef(null)

  // Close panels when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
      if (companyRef.current && !companyRef.current.contains(e.target)) setShowCompanyMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) markAsRead(notif.id)
    if (notif.link) {
      navigate(notif.link)
      setShowNotifications(false)
    }
  }

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

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Company switcher — tampil jika user punya >1 company */}
        {companies.length > 1 && activeCompany && (
          <div className="relative" ref={companyRef}>
            <button
              onClick={() => { setShowCompanyMenu(!showCompanyMenu); setShowDropdown(false); setShowNotifications(false) }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors text-sm text-gray-700 border border-gray-200"
            >
              <Building2 size={14} className="text-primary-600" />
              <span className="max-w-[120px] truncate font-medium">{activeCompany.name}</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showCompanyMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCompanyMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ganti Perusahaan</p>
                  </div>
                  {companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => { setActiveCompany(company); setShowCompanyMenu(false) }}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                        activeCompany.id === company.id
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 size={14} className="flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                      {activeCompany.id === company.id && (
                        <Check size={13} className="ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={() => { navigate('/select-company'); setShowCompanyMenu(false) }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeftRight size={12} />
                      Kelola perusahaan
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false) }}
            className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifikasi {unreadCount > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Check size={12} /> Tandai semua dibaca
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <BellOff size={28} className="mb-2" />
                    <p className="text-sm">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-primary-50/40' : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICON[notif.type] || '📢'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.created_at)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id) }}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false) }}
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
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
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
