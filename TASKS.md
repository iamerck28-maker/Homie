# Homie — Development Tasks

Platform manajemen marketing developer properti Indonesia.

> Cara pakai: centang task yang sudah selesai dengan mengganti `[ ]` menjadi `[x]`

---

## Fase 1 — MVP

### 🛠️ Langkah 1: Setup Project
- [x] Inisialisasi project dengan Vite + React
- [x] Install dan konfigurasi Tailwind CSS
- [x] Install dependencies utama: `react-router-dom`, `zustand`, `@supabase/supabase-js`, `jspdf`, `clsx`, `lucide-react`
- [x] Buat file `.env.local` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- [x] Buat `src/lib/supabase.js` — inisialisasi Supabase client
- [x] Buat struktur folder sesuai `context.md`
- [x] Setup Tailwind config (warna, font, breakpoints)
- [x] Pastikan project bisa build tanpa error

---

### 🗄️ Langkah 2: Database Supabase
- [x] Buat tabel `profiles`
- [x] Buat tabel `projects`
- [x] Buat tabel `units`
- [x] Buat tabel `campaigns`
- [x] Buat tabel `prospects`
- [x] Buat tabel `prospect_activities`
- [x] Buat tabel `bookings`
- [x] Buat tabel `kpr_tracking`
- [x] Buat tabel `kpr_documents`
- [x] Buat tabel `commissions`
- [x] Buat tabel `handovers`
- [x] Buat tabel `payments` *(Fase 2 — tracking DP & cicilan)*
- [x] Buat tabel `waitlist` *(Fase 2 — NUP management)*
- [x] Aktifkan RLS di semua tabel
- [x] Buat helper function `get_my_role()`
- [x] Buat helper function `get_my_projects()`
- [x] Tulis dan test semua RLS policy (marketing, manager, owner)
- [x] Buat trigger: otomatis insert ke `profiles` saat user baru register
- [x] Seed data dummy: 1 owner, 1 manager, 2 marketing, 1 project, 10 unit

---

### 🔐 Langkah 3: Auth & Role
- [x] Buat `src/store/authStore.js` — simpan session, user, dan role
- [x] Buat `src/hooks/useAuth.js` — login, logout, getSession
- [x] Buat `LoginPage.jsx` — form email + password, validasi, error handling
- [x] Buat `ProtectedRoute.jsx` — cek session + cek role sebelum render halaman
- [x] Implementasi redirect setelah login:
  - [x] Owner → `/dashboard/owner`
  - [x] Manager → `/dashboard/manager`
  - [x] Marketing → `/prospects`
- [x] Implementasi logout — clear session + redirect ke `/login`
- [x] Handle kasus: session expired → redirect ke `/login`
- [ ] Test semua role bisa login dan diarahkan ke halaman yang benar

---

### 🧭 Langkah 4: Layout
- [x] Buat `Sidebar.jsx` — menu berbeda per role
- [x] Buat `Navbar.jsx` — nama user, role badge, tombol logout
- [x] Buat `PageWrapper.jsx` — wrapper dengan padding dan judul halaman
- [x] Pastikan layout responsive — sidebar collapse di mobile (hamburger menu)
- [x] Buat halaman `404.jsx` untuk route yang tidak ditemukan

---

### 🏘️ Langkah 5: Master Stok Unit
- [x] Buat `src/hooks/useUnits.js` — fetch, tambah, edit, update status
- [x] Buat `UnitListPage.jsx` — daftar, filter status, search
- [x] Buat `UnitDetailPage.jsx` — detail unit, update status (manager only)
- [x] Form tambah unit (manager only)
- [x] Form edit unit (manager only)
- [x] Update status unit otomatis jadi 'hold' saat booking dibuat

---

### 🎯 Langkah 6: CRM Prospek
- [x] Buat `src/hooks/useProspects.js` — fetch, tambah, edit, update status
- [x] Buat `ProspectListPage.jsx` — tabel, filter, search, banner reminder overdue
- [x] Buat `PipelinePage.jsx` — Kanban drag & drop 5 kolom
- [x] Buat `ProspectDetailPage.jsx` — info, aktivitas, follow-up, assign sales
- [x] Form tambah prospek baru

---

### 📋 Langkah 7: Booking & SPR
- [x] Buat `src/hooks/useBookings.js` — fetch, tambah, update
- [x] Buat `BookingListPage.jsx` — daftar, filter metode bayar
- [x] Buat `BookingDetailPage.jsx` — detail, generate SPR, tracking pembayaran
- [x] Buat `BookingFormPage.jsx` — form dedicated input booking baru
- [x] Buat `BookingRequestsPage.jsx` — daftar pengajuan booking dari marketing
- [x] Form input booking baru (unit otomatis hold)
- [x] Generate SPR PDF via jsPDF

---

### 🏦 Langkah 8: KPR Tracker
- [x] Buat `src/hooks/useKpr.js` — fetch, tambah, update status, update dokumen
- [x] Buat `KprListPage.jsx` — daftar, filter, highlight dokumen hampir expired
- [x] Buat `KprDetailPage.jsx` — timeline status, checklist dokumen, update bank
- [x] Form buat KPR baru (dropdown pilih booking, bukan raw UUID)

---

### 📊 Langkah 9: Dashboard
- [x] Buat `ManagerDashboard.jsx` — prospek, closing, pipeline, unit, KPR, performa sales
- [x] Buat `OwnerDashboard.jsx` — konsolidasi semua project, KPR global

---

### ⚙️ Langkah 10: Settings & User Management
- [x] Buat `ProfilePage.jsx` — edit nama, ganti password
- [x] Buat `UserManagementPage.jsx` (owner only) — daftar, tambah, hapus user
- [x] Buat `ProjectSettingsPage.jsx` (manager only) — edit info project

---

## Fase 2 — Fitur Lanjutan

### 💰 Tracking Pembayaran
- [x] Buat `src/hooks/usePayments.js`
- [x] UI tracking DP & cicilan di `BookingDetailPage.jsx` — riwayat, progress bar, tambah/hapus
- [x] Tabel `payments` di Supabase dengan RLS policy

### 📊 Komisi Sales
- [x] Buat `CommissionPage.jsx` — rekap komisi, approve, tandai dibayar
- [x] Hitung komisi dari persentase harga unit atau nominal langsung
- [x] Tabel `commissions` RLS: marketing hanya lihat milik sendiri

### 📣 Campaign Analytics
- [x] Buat `CampaignPage.jsx` — ROI, closing rate, cost per lead per campaign
- [x] Sinkronisasi channel values dengan DB constraint

### 🏠 Serah Terima (Handover)
- [x] Buat `HandoverListPage.jsx` — daftar jadwal serah terima
- [x] Buat `HandoverDetailPage.jsx` — checklist kondisi unit, defect notes, update status
- [x] Generate BAST PDF via jsPDF

### 📤 Export Laporan
- [x] Buat `src/lib/export.js` — export PDF & Excel
- [x] `ReportsPage.jsx` — export Booking, Prospek, KPR, Komisi

### 📋 NUP / Waitlist
- [x] Buat `WaitlistPage.jsx` — daftar antri, update status, assign sales
- [x] Tabel `waitlist` di Supabase dengan RLS policy dan auto-increment `nup_number`

---

### 🧮 Kalkulator KPR
- [x] Buat `KprCalculatorPage.jsx` — input harga, DP, bunga, tenor
- [x] Tampilkan angsuran/bulan, total bayar, total bunga
- [x] Preset suku bunga per bank (BCA, BRI, Mandiri, BNI, BTN, CIMB)
- [x] Tabel rincian angsuran per tahun (collapsible)
- [x] Route `/kpr/calculator` — accessible marketing & manager
- [x] Menu "Hitung KPR" di sidebar marketing dan manager

---

### 🔄 Consumer Tracking
- [x] Buat `TrackingPage.jsx` — halaman tracking status untuk konsumen
- [x] Buat `TrackingDetailPage.jsx` — detail progress booking & KPR dengan checklist dokumen

### 💀 UX Enhancement
- [x] Skeleton loading components — ganti spinner dengan skeleton untuk semua halaman utama

---

## Fase 2 — Yang Belum Dibangun

- [ ] WhatsApp notifikasi (reminder follow-up, jatuh tempo KPR)
- [x] Upload foto kondisi unit saat serah terima
- [x] Notifikasi in-app (bell icon, badge unread)

---

## Fase 3 (visi jangka panjang — Properti A-Z)

- [ ] Manajemen RAB & material konstruksi
- [ ] Progres pembangunan + upload foto lapangan
- [ ] Laporan keuangan proyek
- [ ] Manajemen dokumen legal (SHM, IMB, dll)
- [ ] Multi-company (satu akun untuk beberapa developer)
- [ ] API & integrasi pihak ketiga
- [ ] Mobile app (React Native)

---

## Bugs & Issues

- [x] ManagerDashboard: `prospectsLastMonth` query tidak include field `status` → closingLastMonth selalu 0
- [x] ProspectDetailPage: dropdown "Assign Sales" kosong karena `salesList` tidak di-fetch
- [x] HandoverListPage & HandoverDetailPage: status `in_progress` tidak valid di DB schema → ganti jadi `rescheduled`
- [x] KprDetailPage (form baru): input booking_id berupa UUID text field → diganti dropdown
- [x] CampaignPage: channel values (`tiktok_ads`, `whatsapp`, `website`, `lainnya`) tidak cocok dengan DB check constraint → constraint DB diupdate via migration
- [x] Waitlist: `nup_number` tidak ada default/auto-increment → ditambahkan trigger per project

---

## Catatan Developer

- Selalu test di mobile setelah selesai mengerjakan satu halaman
- RLS Supabase harus ditest dengan akun berbeda (marketing, manager, owner)
- Semua form harus ada validasi sebelum submit ke Supabase
- Nama aplikasi: **Homie** | Brand color: **Primary Green** (#16a34a / Tailwind green-600)
- Tabel `payments` dan `waitlist` perlu dibuat di Supabase jika belum ada
