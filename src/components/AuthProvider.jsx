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

  useEffect(() => {
    // Jaminan: loading pasti selesai dalam 3 detik — tidak bisa di-cancel oleh async handler
    safetyTimeoutRef.current = setTimeout(() => setLoading(false), 3000)

    // onAuthStateChange menangani semua event termasuk INITIAL_SESSION —
    // tidak perlu getSession() terpisah yang bisa menyebabkan double-fetch dan race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearAuth()
        return
      }

      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED — update session & profile secara silent
      try {
        const profile = await fetchProfile(session.user.id)
        setSession(session)
        setUser(session.user)
        // Hanya update profile jika berhasil di-fetch — jangan hapus role yang sudah ada
        // ketika profile fetch gagal (misal AbortError atau network glitch saat TOKEN_REFRESHED)
        if (profile) setProfile(profile)
      } catch (err) {
        console.error('AuthProvider onAuthStateChange error:', err)
      } finally {
        // Segera selesaikan loading jika profile sudah siap (lebih cepat dari 3 detik)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(safetyTimeoutRef.current)
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return <PageLoader />
  return children
}
