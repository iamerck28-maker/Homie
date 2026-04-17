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
  const safetyTimeoutRef = useRef(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const { setSession, setUser, setProfile, setLoading, clearAuth } = useAuthStore.getState()

    safetyTimeoutRef.current = setTimeout(() => setLoading(false), 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
        return
      }

      // Callback SYNC — tidak await agar navigator.locks segera dilepas.
      // Profile fetch jalan di background, tidak menghalangi query halaman lain.
      setSession(session)
      setUser(session.user)

      const fetchId = ++fetchIdRef.current
      ;(async () => {
        try {
          const profile = await fetchProfile(session.user.id)
          if (fetchId !== fetchIdRef.current) return
          if (profile) setProfile(profile)
        } catch {
          // silent
        } finally {
          if (fetchId === fetchIdRef.current) setLoading(false)
        }
      })()
    })

    return () => {
      clearTimeout(safetyTimeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  const loading = useAuthStore((s) => s.loading)
  if (loading) return <PageLoader />
  return children
}
