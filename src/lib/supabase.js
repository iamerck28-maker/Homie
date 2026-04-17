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

const customFetch = async (url, options = {}) => {
  const controller = new AbortController()
  pendingControllers.add(controller)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    pendingControllers.delete(controller)
  }
}

// ─── Deteksi public page ──────────────────────────────────────────────────────
// Halaman /track/* adalah public (consumer tracking), tidak perlu auth.
// Module ini di-load sekali saat app pertama dibuka — pathname saat itu
// menentukan apakah ini tab konsumen atau tab app utama.
const isPublicPage = typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/track')

// ─── Bersihkan session hanya saat di halaman login ───────────────────────────
// JANGAN hapus token yang expired di sini — Supabase akan otomatis refresh
// menggunakan refresh_token. Jika kita hapus token expired, refresh_token ikut
// terhapus dan user terpaksa login ulang padahal refresh_token masih valid.
try {
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0]
  const storageKey = `sb-${projectRef}-auth-token`
  const path = typeof window !== 'undefined' ? window.location.pathname : ''

  if (path === '/login') {
    // Halaman login: hapus session lama agar lock dilepas sebelum login baru
    localStorage.removeItem(storageKey)
  }
  // Halaman lain: biarkan Supabase yang handle — dia akan refresh token secara otomatis
} catch { /* abaikan error */ }

// ─── Supabase client ──────────────────────────────────────────────────────────
// Public page (tab konsumen): persistSession & autoRefreshToken dimatikan agar
// tidak berkompetisi dengan tab app utama dalam memperebutkan navigator.locks.
// Dua client aktif yang sama-sama refresh token → "refresh token already used"
// → SIGNED_OUT di salah satu tab → logout paksa.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isPublicPage,
    autoRefreshToken: !isPublicPage,
    detectSessionInUrl: false,
  },
  global: { fetch: isPublicPage ? undefined : customFetch },
})

// ─── Fetch data tracking konsumen (tanpa Supabase JS client) ─────────────────
// Menggunakan plain fetch agar tidak menyentuh navigator.locks yang sama
// dengan client utama — mencegah lock conflict yang menyebabkan query hang.
export async function fetchTrackingData(accessCode) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_tracking_by_code`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_access_code: accessCode }),
  })
  if (!res.ok) return null
  return res.json()
}
