import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  CreditCard,
  BarChart3,
  Megaphone,
  KeyRound,
  ListOrdered,
  Settings,
  UserCog,
  Home,
  FileText,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FolderOpen,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { clsx } from 'clsx'

const menuByRole = {
  marketing: [
    { path: '/waitlist', label: 'NUP / Waitlist', icon: ListOrdered },
    { path: '/prospects', label: 'Prospek', icon: Users },
    { path: '/units', label: 'Stok Unit', icon: Building2 },
    { path: '/booking-requests', label: 'Permintaan Booking', icon: Inbox },
    { path: '/bookings', label: 'Booking', icon: ClipboardList },
    { path: '/kpr', label: 'KPR', icon: CreditCard },
    { path: '/kpr/calculator', label: 'Hitung KPR', icon: Calculator },
    { path: '/commissions', label: 'Komisi Saya', icon: BarChart3 },
    { path: '/reports', label: 'Laporan', icon: FileText },
    { path: '/settings/profile', label: 'Profil', icon: Settings },
  ],
  manager: [
    { path: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/waitlist', label: 'NUP / Waitlist', icon: ListOrdered },
    { path: '/prospects', label: 'Prospek', icon: Users },
    { path: '/units', label: 'Stok Unit', icon: Building2 },
    { path: '/booking-requests', label: 'Permintaan Booking', icon: Inbox },
    { path: '/bookings', label: 'Booking', icon: ClipboardList },
    { path: '/kpr', label: 'KPR', icon: CreditCard },
    { path: '/kpr/calculator', label: 'Hitung KPR', icon: Calculator },
    { path: '/handovers', label: 'Serah Terima', icon: KeyRound },
    { path: '/commissions', label: 'Komisi Tim', icon: BarChart3 },
    { path: '/campaigns', label: 'Campaign', icon: Megaphone },
    { path: '/reports', label: 'Laporan', icon: FileText },
    { path: '/settings/project', label: 'Pengaturan Project', icon: Settings },
    { path: '/settings/profile', label: 'Profil Saya', icon: UserCog },
  ],
  owner: [
    { path: '/dashboard/owner', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Daftar Proyek', icon: FolderOpen },
    { path: '/units', label: 'Semua Unit', icon: Building2 },
    { path: '/kpr', label: 'Status KPR', icon: CreditCard },
    { path: '/campaigns', label: 'Campaign', icon: Megaphone },
    { path: '/reports', label: 'Laporan', icon: FileText },
    { path: '/settings/company', label: 'Pengguna & Tim', icon: Users },
  ],
}

function NavItem({ item, collapsed }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          collapsed && 'justify-center px-2',
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <Icon size={18} className="flex-shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, role, activeCompany } = useAuthStore()
  const menus = menuByRole[role] || []

  const roleLabel = {
    owner: 'Owner',
    manager: 'Manager Marketing',
    marketing: 'Marketing',
  }

  return (
    <aside
      className={clsx(
        'flex flex-col bg-white border-r border-gray-100 transition-all duration-300 h-full',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 py-5 border-b border-gray-100', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Home size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-base leading-none">Homie</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {activeCompany ? activeCompany.name : 'Properti Indonesia'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menus.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User info */}
      {!collapsed && profile && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">
                {profile.full_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name}</p>
              <p className="text-xs text-gray-500">{roleLabel[role]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center w-full py-3 border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
