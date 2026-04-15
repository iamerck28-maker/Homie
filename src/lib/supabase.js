import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables.')
}

// Kumpulkan AbortController dari semua request aktif.
// abortPendingRequests() dipanggil sebelum login untuk batalkan
// auto-refresh yang sedang pending agar lock segera dilepas.
const pendingControllers = new Set()

export function abortPendingRequests() {
  pendingControllers.forEach((c) => c.abort())
  pendingControllers.clear()
}

const customFetch = (url, options = {}) => {
  const controller = new AbortController()
  pendingControllers.add(controller)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => pendingControllers.delete(controller))
}

// ─── CRITICAL FIX untuk Chrome ───────────────────────────────────────────────
// Saat di halaman /login, hapus session tersimpan SEBELUM Supabase client dibuat.
// Ini mencegah auto-refresh token yang memegang navigator.locks, yang menyebabkan
// signInWithPassword nunggu sampai HTTP timeout (~60 detik) di Chrome.
// Safari tidak terpengaruh karena HTTP stack-nya berbeda, tapi fix ini berlaku global.
try {
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  const storageKey = `sb-${projectRef}-auth-token`

  const onLoginPage = typeof window !== 'undefined' &&
    window.location.pathname === '/login'

  if (onLoginPage) {
    // Hapus session apapun — di halaman login user pasti ingin masuk ulang
    localStorage.removeItem(storageKey)
  } else {
    // Di halaman lain: hanya hapus session yang sudah expired
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const { expires_at } = JSON.parse(raw)
      if (expires_at && expires_at * 1000 < Date.now()) {
        localStorage.removeItem(storageKey)
      }
    }
  }
} catch { /* abaikan error parsing */ }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: { fetch: customFetch },
})
