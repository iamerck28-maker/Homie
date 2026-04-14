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
- [x] Buat tabel `handovers` (struktur saja, UI di Fase 2)
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
- [x] Buat `Sidebar.jsx` — menu berbeda per role:
  - [x] Marketing: Prospek, Unit, Booking, KPR, Komisi Saya
  - [x] Manager: Dashboard, Prospek, Unit, Booking, KPR, Komisi Tim, Pengaturan
  - [x] Owner: Dashboard, Semua Unit, KPR, Pengguna
- [x] Buat `Navbar.jsx` — nama user, role badge, tombol logout
- [x] Buat `PageWrapper.jsx` — wrapper dengan padding dan judul halaman
- [x] Pastikan layout responsive — sidebar collapse di mobile (hamburger menu)
- [x] Buat halaman `404.jsx` untuk route yang tidak ditemukan

---

### 🏘️ Langkah 5: Master Stok Unit
- [x] Buat `src/hooks/useUnits.js` — fetch, tambah, edit, update status
- [x] Buat `UnitListPage.jsx`:
  - [x] Tampilkan daftar unit per project
  - [x] Filter by status (available, hold, indent, sold)
  - [x] Filter by cluster/blok (via search)
  - [x] Kolom: nomor, tipe, luas, harga, status, aksi
- [x] Buat `UnitDetailPage.jsx`:
  - [x] Detail lengkap unit
  - [x] Tombol update status (manager only)
- [x] Form tambah unit (manager only)
- [x] Form edit unit (manager only)
- [x] Update status unit saat booking dibuat (otomatis jadi 'hold')

---

### 🎯 Langkah 6: CRM Prospek
- [x] Buat `src/hooks/useProspects.js` — fetch, tambah, edit, update status
- [x] Buat `ProspectListPage.jsx`:
  - [x] Tabel daftar prospek
  - [x] Filter by status, project
  - [x] Search by nama atau nomor HP
  - [x] Marketing hanya lihat prospek milik sendiri (via RLS)
  - [x] Manager lihat semua prospek di projectnya (via RLS)
- [x] Buat `PipelinePage.jsx` (Kanban board):
  - [x] 5 kolom: Baru, Follow-Up, Survei, Negosiasi, Closing
  - [x] Card prospek bisa drag & drop antar kolom
  - [x] Tampilkan nama, unit diminati, sales assigned
- [x] Buat `ProspectDetailPage.jsx`:
  - [x] Info lengkap prospek
  - [x] Riwayat aktivitas (call, WA, kunjungan, meeting, catatan)
  - [x] Form tambah aktivitas baru
  - [x] Set jadwal follow-up berikutnya
  - [x] Tombol pindah status
  - [x] Tombol hapus (manager only)
- [x] Form tambah prospek baru
- [x] Halaman reminder harian (banner alert di atas ProspectListPage)

---

### 📋 Langkah 7: Booking & SPR
- [x] Buat `src/hooks/useBookings.js` — fetch, tambah, update
- [x] Buat `BookingListPage.jsx`:
  - [x] Daftar semua booking per project
  - [x] Filter by metode pembayaran
  - [x] Kolom: pembeli, unit, metode bayar, tanggal booking, status SPR
- [x] Buat `BookingDetailPage.jsx`:
  - [x] Detail lengkap booking
  - [x] Tombol generate SPR PDF
  - [x] Download SPR
- [x] Form input booking baru:
  - [x] Input semua field yang dibutuhkan
  - [x] Setelah submit: status unit otomatis berubah jadi 'hold'
- [x] Generate SPR PDF via jsPDF

---

### 🏦 Langkah 8: KPR Tracker
- [x] Buat `src/hooks/useKpr.js` — fetch, tambah, update status, update dokumen
- [x] Buat `KprListPage.jsx`:
  - [x] Daftar semua pengajuan KPR
  - [x] Filter by status, bank
  - [x] Visual indicator: highlight yang ada dokumen hampir kadaluarsa
- [x] Buat `KprDetailPage.jsx`:
  - [x] Info pembeli dan unit
  - [x] Status tracking per bank (timeline visual)
  - [x] Checklist dokumen (default + custom)
  - [x] Update status pengajuan bank
  - [x] Alert dokumen hampir expired

---

### 📊 Langkah 9: Dashboard
- [x] Buat `ManagerDashboard.jsx`:
  - [x] Total prospek bulan ini vs bulan lalu
  - [x] Total closing bulan ini
  - [x] Closing rate keseluruhan tim
  - [x] Tabel performa per sales
  - [x] Pipeline summary per stage
  - [x] Unit tersisa vs terjual
  - [x] KPR summary
- [x] Buat `OwnerDashboard.jsx`:
  - [x] Selector: lihat semua project atau pilih satu
  - [x] Card summary: total unit, terjual, tersisa, revenue
  - [x] Perbandingan antar project (tabel)
  - [x] Status KPR global

---

### ⚙️ Langkah 10: Settings & User Management
- [x] Buat `ProfilePage.jsx` — edit nama, ganti password (semua role)
- [x] Buat `UserManagementPage.jsx` (owner only):
  - [x] Daftar semua user (marketing & manager)
  - [x] Tambah user baru
  - [x] Hapus user
- [x] Buat `ProjectSettingsPage.jsx` (manager only):
  - [x] Edit info project (nama, lokasi, deskripsi)

---

## Fase 2 (setelah MVP selesai dan ada revenue)

- [ ] Tracking pembayaran DP & cicilan per pembeli
- [ ] Kalkulasi dan approval komisi sales
- [ ] Campaign analytics & ROI per sumber lead
- [ ] Serah terima unit — checklist kondisi + upload foto
- [ ] Generate BAST (Berita Acara Serah Terima) PDF
- [ ] WhatsApp notifikasi (reminder follow-up, jatuh tempo KPR)
- [ ] Export laporan ke Excel dan PDF
- [ ] NUP / waitlist management sebelum launching

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

> Catat bug yang ditemukan saat development di sini

- [ ] (kosong)

---

## Catatan Developer

- Selalu test di mobile setelah selesai mengerjakan satu halaman
- RLS Supabase harus ditest dengan akun berbeda (marketing, manager, owner) — jangan hanya test dengan satu akun
- Jangan lupa handle loading state dan error state di setiap halaman yang fetch data
- Semua form harus ada validasi sebelum submit ke Supabase
- Nama aplikasi: **Homie**
- Brand color utama: **Primary Green** (#16a34a / Tailwind green-600)
