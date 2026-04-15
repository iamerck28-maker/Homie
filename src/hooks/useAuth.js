import { useNavigate } from 'react-router-dom'
import { supabase, abortPendingRequests } from '../lib/supabase'
import useAuthStore from '../store/authStore'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const login = async (email, password) => {
    // Batalkan semua request Supabase yang pending (auto-refresh token)
    // agar internal navigator.locks dilepas sebelum signInWithPassword dipanggil
    abortPendingRequests()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Set session/user langsung dari response — tidak perlu fetch profile di sini.
    // onAuthStateChange di AuthProvider akan fetch profile & set role secara async.
    // AuthRoot di routes/index.jsx akan redirect ke halaman yang tepat setelah role tersedia.
    store.setSession(data.session)
    store.setUser(data.user)
    navigate('/')
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
