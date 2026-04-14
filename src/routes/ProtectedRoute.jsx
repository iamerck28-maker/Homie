import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getDefaultRoute } from '../lib/utils'

/**
 * allowedRoles: array role yang boleh akses, misal ['manager', 'owner']
 * Jika tidak diisi, semua role yang login bisa akses
 */
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { session, role, loading } = useAuthStore()

  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace />

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return children
}
