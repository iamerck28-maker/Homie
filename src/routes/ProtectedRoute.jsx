import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { getDefaultRoute } from '../lib/utils'
import { hasSkippedOnboarding } from '../pages/onboarding/OnboardingPage'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { session, role, loading, companies, activeCompany } = useAuthStore()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (!role) return <Navigate to="/login" replace />

  // User belum punya company — redirect onboarding kecuali sudah skip
  if (companies.length === 0 && !hasSkippedOnboarding()) {
    return <Navigate to="/onboarding" replace />
  }

  // Punya company tapi belum pilih → pilih company
  if (companies.length > 0 && !activeCompany) {
    return <Navigate to="/select-company" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />
  }

  return children
}
