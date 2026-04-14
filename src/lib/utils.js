/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount) {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDate(date, options = {}) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

/**
 * Format tanggal singkat
 */
export function formatDateShort(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format tanggal relatif (misal: "3 hari lalu")
 */
export function formatRelativeDate(date) {
  if (!date) return '-'
  const now = new Date()
  const target = new Date(date)
  const diffMs = now - target
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`
  return `${Math.floor(diffDays / 365)} tahun lalu`
}

/**
 * Cek apakah tanggal sudah lewat
 */
export function isOverdue(date) {
  if (!date) return false
  return new Date(date) < new Date()
}

/**
 * Cek apakah tanggal dalam N hari ke depan
 */
export function isWithinDays(date, days) {
  if (!date) return false
  const target = new Date(date)
  const now = new Date()
  const future = new Date()
  future.setDate(now.getDate() + days)
  return target >= now && target <= future
}

/**
 * Label status prospek
 */
export const PROSPECT_STATUS_LABELS = {
  new: 'Baru',
  followup: 'Follow-Up',
  survey: 'Survei',
  negotiation: 'Negosiasi',
  closing: 'Closing',
  cancel: 'Batal',
}

/**
 * Label status unit
 */
export const UNIT_STATUS_LABELS = {
  available: 'Tersedia',
  hold: 'Hold',
  indent: 'Indent',
  sold: 'Terjual',
}

/**
 * Label status KPR
 */
export const KPR_STATUS_LABELS = {
  dokumen: 'Dokumen',
  ojk: 'OJK',
  appraisal: 'Appraisal',
  sp3k: 'SP3K',
  akad: 'Akad',
  cair: 'Cair',
  ditolak: 'Ditolak',
}

/**
 * Label channel campaign
 */
export const CAMPAIGN_CHANNEL_LABELS = {
  meta_ads: 'Meta Ads',
  google_ads: 'Google Ads',
  tokopedia: 'Tokopedia',
  brosur: 'Brosur',
  referral: 'Referral',
  pameran: 'Pameran',
  other: 'Lainnya',
}

/**
 * Label metode pembayaran
 */
export const PAYMENT_METHOD_LABELS = {
  kpr: 'KPR',
  cash: 'Cash',
  cash_bertahap: 'Cash Bertahap',
}

/**
 * Label tipe aktivitas
 */
export const ACTIVITY_TYPE_LABELS = {
  call: 'Telepon',
  whatsapp: 'WhatsApp',
  visit: 'Kunjungan',
  meeting: 'Meeting',
  note: 'Catatan',
}

/**
 * Warna badge status prospek
 */
export function getProspectStatusColor(status) {
  const colors = {
    new: 'bg-blue-100 text-blue-700',
    followup: 'bg-yellow-100 text-yellow-700',
    survey: 'bg-purple-100 text-purple-700',
    negotiation: 'bg-orange-100 text-orange-700',
    closing: 'bg-green-100 text-green-700',
    cancel: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Warna badge status unit
 */
export function getUnitStatusColor(status) {
  const colors = {
    available: 'bg-green-100 text-green-700',
    hold: 'bg-yellow-100 text-yellow-700',
    indent: 'bg-blue-100 text-blue-700',
    sold: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Warna badge status KPR
 */
export function getKprStatusColor(status) {
  const colors = {
    dokumen: 'bg-gray-100 text-gray-700',
    ojk: 'bg-blue-100 text-blue-700',
    appraisal: 'bg-purple-100 text-purple-700',
    sp3k: 'bg-yellow-100 text-yellow-700',
    akad: 'bg-orange-100 text-orange-700',
    cair: 'bg-green-100 text-green-700',
    ditolak: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

/**
 * Truncate teks
 */
export function truncate(str, length = 50) {
  if (!str) return ''
  return str.length > length ? str.slice(0, length) + '...' : str
}

/**
 * Generate inisial dari nama
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Halaman utama per role
 */
export function getDefaultRoute(role) {
  const routes = {
    owner: '/dashboard/owner',
    manager: '/dashboard/manager',
    marketing: '/prospects',
  }
  return routes[role] || '/login'
}
