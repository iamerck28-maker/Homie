import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import { clearOnboardingSkipped } from '../pages/onboarding/OnboardingPage'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Jangan set session/user manual di sini — biarkan onAuthStateChange di AuthProvider
    // yang handle semuanya. Double-set menyebabkan SIGNED_IN fire dua kali.
    navigate('/')
  }

  const logout = async () => {
    clearOnboardingSkipped()
    await supabase.auth.signOut()
    store.clearAuth()
    navigate('/login')
  }

  return {
    session: store.session,
    user: store.user,
    profile: store.profile,
    role: store.role,
    loading: store.loading,
    login,
    logout,
  }
}
