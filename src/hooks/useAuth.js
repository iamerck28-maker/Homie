import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import { getDefaultRoute } from '../lib/utils'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const login = async (email, password) => {
    // Bersihkan stale token di localStorage tanpa network request
    // Mencegah hanging 60 detik saat ada sesi lama yang expired
    await supabase.auth.signOut({ scope: 'local' })

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Profile akan otomatis di-set oleh onAuthStateChange di AuthProvider
    // Tapi kita perlu tunggu sebentar agar role tersedia sebelum navigate
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    store.setSession(data.session)
    store.setUser(data.user)
    store.setProfile(profile)

    navigate(getDefaultRoute(profile?.role))
    return { session: data.session, profile }
  }

  const logout = async () => {
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
