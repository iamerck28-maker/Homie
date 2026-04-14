import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/authStore'
import { PageLoader } from './ui/LoadingSpinner'

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export default function AuthProvider({ children }) {
  const { loading, setSession, setUser, setProfile, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    // Cek session aktif saat pertama load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session) {
          const profile = await fetchProfile(session.user.id)
          setSession(session)
          setUser(session.user)
          setProfile(profile)
        }
      } catch (err) {
        console.error('AuthProvider getSession error:', err)
      } finally {
        setLoading(false)
      }
    })

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
      } else if (session) {
        try {
          const profile = await fetchProfile(session.user.id)
          setSession(session)
          setUser(session.user)
          setProfile(profile)
        } catch (err) {
          console.error('AuthProvider onAuthStateChange error:', err)
        } finally {
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <PageLoader />

  return children
}
