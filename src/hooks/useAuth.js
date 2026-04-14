import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import { getDefaultRoute } from '../lib/utils'

export function useAuth() {
  const { session, user, profile, role, loading, setSession, setUser, setProfile, setLoading, clearAuth } =
    useAuthStore()

  const navigate = useNavigate()

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    return data
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const profile = await fetchProfile(data.user.id)
    setSession(data.session)
    setUser(data.user)
    setProfile(profile)

    navigate(getDefaultRoute(profile?.role))
    return { session: data.session, profile }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/login')
  }

  useEffect(() => {
    // Cek session aktif saat pertama load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setSession(session)
        setUser(session.user)
        setProfile(profile)
      }
      setLoading(false)
    })

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
      } else if (session) {
        const profile = await fetchProfile(session.user.id)
        setSession(session)
        setUser(session.user)
        setProfile(profile)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, user, profile, role, loading, login, logout }
}
