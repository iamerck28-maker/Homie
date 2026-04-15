import { createBrowserRouter, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AppLayout from '../components/layout/AppLayout'
import useAuthStore from '../store/authStore'

// Auth
import LoginPage from '../pages/auth/LoginPage'

// Dashboard
import ManagerDashboard from '../pages/dashboard/ManagerDashboard'
import OwnerDashboard from '../pages/dashboard/OwnerDashboard'

// Units
import UnitListPage from '../pages/units/UnitListPage'
import UnitDetailPage from '../pages/units/UnitDetailPage'

// Prospects
import ProspectListPage from '../pages/prospects/ProspectListPage'
import ProspectDetailPage from '../pages/prospects/ProspectDetailPage'
import PipelinePage from '../pages/prospects/PipelinePage'

// Bookings
import BookingListPage from '../pages/bookings/BookingListPage'
import BookingDetailPage from '../pages/bookings/BookingDetailPage'

// KPR
import KprListPage from '../pages/kpr/KprListPage'
import KprDetailPage from '../pages/kpr/KprDetailPage'
import KprCalculatorPage from '../pages/kpr/KprCalculatorPage'

// Commissions
import CommissionPage from '../pages/commissions/CommissionPage'

// Settings
import ProfilePage from '../pages/settings/ProfilePage'
import UserManagementPage from '../pages/settings/UserManagementPage'
import ProjectSettingsPage from '../pages/settings/ProjectSettingsPage'
import ReportsPage from '../pages/reports/ReportsPage'
import CampaignPage from '../pages/campaigns/CampaignPage'
import HandoverListPage from '../pages/handovers/HandoverListPage'
import HandoverDetailPage from '../pages/handovers/HandoverDetailPage'
import WaitlistPage from '../pages/waitlist/WaitlistPage'

// 404
import NotFoundPage from '../pages/NotFoundPage'

function AuthRoot() {
  const { session, role, loading } = useAuthStore()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (role === 'owner') return <Navigate to="/dashboard/owner" replace />
  if (role === 'manager') return <Navigate to="/dashboard/manager" replace />
  return <Navigate to="/prospects" replace />
}

function WithLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthRoot />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },

  // Dashboard
  {
    path: '/dashboard/manager',
    element: <WithLayout allowedRoles={['manager']}><ManagerDashboard /></WithLayout>,
  },
  {
    path: '/dashboard/owner',
    element: <WithLayout allowedRoles={['owner']}><OwnerDashboard /></WithLayout>,
  },

  // Units
  {
    path: '/units',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><UnitListPage /></WithLayout>,
  },
  {
    path: '/units/:id',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><UnitDetailPage /></WithLayout>,
  },

  // Prospects
  {
    path: '/prospects',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><ProspectListPage /></WithLayout>,
  },
  {
    path: '/prospects/pipeline',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><PipelinePage /></WithLayout>,
  },
  {
    path: '/prospects/:id',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><ProspectDetailPage /></WithLayout>,
  },

  // Bookings
  {
    path: '/bookings',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><BookingListPage /></WithLayout>,
  },
  {
    path: '/bookings/:id',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><BookingDetailPage /></WithLayout>,
  },

  // KPR
  {
    path: '/kpr',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><KprListPage /></WithLayout>,
  },
  {
    path: '/kpr/calculator',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><KprCalculatorPage /></WithLayout>,
  },
  {
    path: '/kpr/:id',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><KprDetailPage /></WithLayout>,
  },

  // Commissions
  {
    path: '/commissions',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><CommissionPage /></WithLayout>,
  },

  // Settings
  {
    path: '/settings/profile',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><ProfilePage /></WithLayout>,
  },
  {
    path: '/settings/users',
    element: <WithLayout allowedRoles={['owner']}><UserManagementPage /></WithLayout>,
  },
  {
    path: '/settings/project',
    element: <WithLayout allowedRoles={['manager']}><ProjectSettingsPage /></WithLayout>,
  },

  // Reports
  {
    path: '/reports',
    element: <WithLayout allowedRoles={['marketing', 'manager', 'owner']}><ReportsPage /></WithLayout>,
  },

  // Campaigns
  {
    path: '/campaigns',
    element: <WithLayout allowedRoles={['manager', 'owner']}><CampaignPage /></WithLayout>,
  },

  // Handovers
  {
    path: '/handovers',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><HandoverListPage /></WithLayout>,
  },
  {
    path: '/handovers/:id',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><HandoverDetailPage /></WithLayout>,
  },

  // Waitlist / NUP
  {
    path: '/waitlist',
    element: <WithLayout allowedRoles={['marketing', 'manager']}><WaitlistPage /></WithLayout>,
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default router
