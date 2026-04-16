import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getDefaultRoute } from '../lib/utils'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { session, role, loading } = useAuthStore()

  // Tunggu initial auth load
  if (loading) return null

  if (!session) return <Navigate to="/login" replace />

  // Session ada tapi role belum siap — ini race condition singkat saat SIGNED_IN.
  // Jika sudah tidak loading tapi role tetap null, session kemungkinan rusak → ke login.
  if (!role) return <Navigate to="/login" replace />

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return children
}
