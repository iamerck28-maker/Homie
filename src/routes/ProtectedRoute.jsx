import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getDefaultRoute } from '../lib/utils'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { session, role } = useAuthStore()

  if (!session) return <Navigate to="/login" replace />

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return children
}
