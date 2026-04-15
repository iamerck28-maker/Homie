import { useEffect, useRef } from 'react'
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
  const safetyTimeoutRef = useRef(null)

  const armSafetyTimeout = () => {
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current)
    safetyTimeoutRef.current = setTimeout(() => {
      setLoading(false)
    }, 8000)
  }

  const clearSafetyTimeout = () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current)
      safetyTimeoutRef.current = null
    }
  }

  useEffect(() => {
    armSafetyTimeout()

    // Cek session aktif saat pertama load
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
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
          clearSafetyTimeout()
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('AuthProvider getSession failed:', err)
        clearSafetyTimeout()
        setLoading(false)
      })

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearSafetyTimeout()
        clearAuth()
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Set loading true agar ProtectedRoute menunggu profile siap
        setLoading(true)
        armSafetyTimeout()
        try {
          const profile = await fetchProfile(session.user.id)
          setSession(session)
          setUser(session.user)
          setProfile(profile)
        } catch (err) {
          console.error('AuthProvider onAuthStateChange error:', err)
        } finally {
          clearSafetyTimeout()
          setLoading(false)
        }
      }
    })

    return () => {
      clearSafetyTimeout()
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <PageLoader />

  return children
}
