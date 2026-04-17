# Homie — Project Context

## Tentang Produk
Homie adalah platform manajemen marketing developer properti Indonesia. Fokus pada alur lengkap dari iklan pertama sampai unit selesai diserahterimakan. Target pengguna: developer perumahan kecil-menengah dengan 1–5 project aktif.

**Status:** Fase 1 MVP hampir selesai. Beberapa fitur Fase 2 sudah dibangun lebih awal (handovers, campaigns, waitlist/NUP, payments, reports, public booking form).

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Hosting | Vercel |
| PDF Generate | jsPDF |
| State Management | Zustand |
| Routing | React Router v6 |

**Supabase Project ID:** `tmcactnakgupaemydtkz`

---

## 3 Role Pengguna

### 1. Marketing / Sales
- Input dan kelola data prospek milik sendiri
- Update status unit (hold/available)
- Input booking, cetak SPR PDF
- Checklist pasca-closing per pembeli
- Update status pengajuan KPR
- Lihat reminder follow-up harian
- Kalkulator simulasi KPR
- Lihat komisi earned milik sendiri (read only)
- Setujui permintaan booking dari konsumen (tahap pertama)
- **Tidak bisa** hapus data apapun
- **Hanya bisa edit** data yang dia sendiri buat

### 2. Manager Marketing
- Semua akses Marketing
- Edit dan hapus data seluruh anggota tim
- Assign/pindahkan prospek antar sales
- Pantau performa per sales (closing rate, pipeline)
- Approve komisi tim sebelum dibayar
- Setup project baru, input data unit, set harga
- Ekspor laporan per periode
- Setup pengaturan project (bank rekening, booking code)
- Setujui final permintaan booking konsumen → auto-create booking
- Batalkan booking (soft cancel)
- **Tidak bisa** lihat dashboard konsolidasi semua project
- **Tidak bisa** tambah atau hapus akun user

### 3. Owner
- Dashboard konsolidasi semua project sekaligus
- Bandingkan performa antar project dan manager
- Tambah dan hapus akun user (marketing & manager)
- **Hanya baca** — tidak bisa edit, hapus, atau input data operasional

---

## Tabel Permission Detail

| Aksi | Marketing | Manager | Owner |
|---|---|---|---|
| Input prospek baru | ✓ | ✓ | ✗ |
| Edit data prospek | Milik sendiri | Seluruh tim | ✗ |
| Hapus data prospek | ✗ | ✓ | ✗ |
| Input booking unit | ✓ | ✓ | ✗ |
| Batalkan booking | ✗ | ✓ | ✗ |
| Generate SPR / BAST | ✓ | ✓ | ✗ |
| Approve booking request (tahap 1) | ✓ | ✓ | ✗ |
| Approve booking request final (tahap 2) | ✗ | ✓ | ✗ |
| Setup project & harga unit | ✗ | ✓ | ✗ |
| Dashboard performa tim | ✗ | ✓ | ✓ |
| Dashboard konsolidasi semua project | ✗ | ✗ | ✓ |
| Tambah / hapus akun user | ✗ | ✗ | ✓ |

---

## Database Schema (Supabase / PostgreSQL)

> `kpr_documents` sudah dihapus — digantikan oleh `pascaclosing_items`.

### Tabel: `profiles`
```sql
id uuid references auth.users primary key
full_name text not null
role text not null check (role in ('marketing', 'manager', 'owner'))
project_ids uuid[]
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `projects`
```sql
id uuid primary key default gen_random_uuid()
name text not null
location text
description text
manager_id uuid references profiles(id)
owner_id uuid references profiles(id)
status text default 'active' check (status in ('active', 'completed', 'paused'))
bank_name text                  -- info rekening untuk booking fee
bank_account_number text
bank_account_name text
booking_fee_default numeric
booking_code text               -- short code unik, format: GVC26 (inisial + 2 digit tahun)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `units`
```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
cluster text
blok text
nomor text not null
tipe text
luas_tanah numeric
luas_bangunan numeric
harga numeric not null
status text default 'available' check (status in ('available', 'hold', 'indent', 'sold'))
held_by uuid references profiles(id)
held_at timestamptz
notes text
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `campaigns`
```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) on delete cascade
name text not null
channel text check (channel in ('meta_ads', 'google_ads', 'tokopedia', 'brosur', 'referral', 'pameran', 'other'))
budget numeric
start_date date
end_date date
created_by uuid references profiles(id)
created_at timestamptz default now()
```

### Tabel: `prospects`
```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id)
unit_id uuid references units(id)
campaign_id uuid references campaigns(id)
assigned_to uuid references profiles(id) not null
full_name text not null
phone text
email text
source text
status text default 'new' check (status in ('new', 'followup', 'survey', 'negotiation', 'closing', 'cancel'))
notes text
next_followup_at timestamptz
created_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `prospect_activities`
```sql
id uuid primary key default gen_random_uuid()
prospect_id uuid references prospects(id) on delete cascade
activity_type text check (activity_type in ('call', 'whatsapp', 'visit', 'meeting', 'note'))
notes text not null
created_by uuid references profiles(id)
created_at timestamptz default now()
```

### Tabel: `bookings`
```sql
id uuid primary key default gen_random_uuid()
prospect_id uuid references prospects(id)       -- null jika booking dari public form
unit_id uuid references units(id) not null
project_id uuid references projects(id) not null
buyer_name text not null
buyer_phone text
buyer_email text
buyer_nik text
booking_fee numeric
booking_date date not null
payment_method text check (payment_method in ('kpr', 'cash', 'cash_bertahap'))
transaction_stage text default 'booking'
  check (transaction_stage in ('booking', 'kpr_process', 'ppjb', 'akad', 'serah_terima', 'selesai'))
access_code text                -- kode akses untuk consumer tracking (format: XXXX-XXXX)
ppjb_date date
ppjb_notes text
notes text
spr_generated_at timestamptz
spr_url text
cancelled_at timestamptz        -- soft cancel: set saat booking dibatalkan
cancellation_reason text
cancelled_by uuid references profiles(id)
created_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `payments`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id)
type text not null check (type in ('dp', 'cicilan', 'pelunasan', 'lainnya'))
amount numeric not null
payment_date date not null
payment_method text default 'transfer' check (payment_method in ('cash', 'transfer', 'cek', 'giro'))
notes text
created_by uuid references profiles(id)
created_at timestamptz default now()
```

### Tabel: `pascaclosing_items`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id) not null
item_name text not null
is_complete boolean default false
completed_at timestamptz
sort_order integer default 0
created_by uuid references profiles(id)
created_at timestamptz default now()
```
> Auto-generate 5 default item saat BookingDetailPage pertama dibuka:
> Tanda Tangan PPJB, Pembayaran DP Pertama, Pembayaran Pelunasan (jika cash), Penerbitan SPR, Penjadwalan Akad / Serah Terima

### Tabel: `kpr_tracking`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id) on delete cascade
bank_name text not null
status text default 'dokumen'
  check (status in ('dokumen', 'ojk', 'appraisal', 'sp3k', 'akad', 'cair', 'ditolak'))
submission_date date
sp3k_date date
akad_date date
notes text
updated_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `booking_requests`
```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id) not null
unit_id uuid references units(id) not null
buyer_name text not null
buyer_phone text not null
buyer_address text not null
payment_method text check (payment_method in ('kpr', 'cash', 'cash_bertahap'))
ktp_url text
transfer_proof_url text
transfer_amount numeric
status text default 'pending'
  check (status in ('pending', 'approved_sales', 'approved_manager', 'rejected', 'cancelled'))
rejection_reason text           -- dipakai juga untuk alasan pembatalan
sales_reviewed_by uuid references profiles(id)
sales_reviewed_at timestamptz
manager_reviewed_by uuid references profiles(id)
manager_reviewed_at timestamptz
notes text
created_at timestamptz default now()
```
> Alur: konsumen isi form publik → status `pending` → sales setujui → `approved_sales`
> → manager setujui final → `approved_manager` + auto-create booking + unit di-hold
> Double booking prevention: phone number unik per project per unit

### Tabel: `waitlist`
```sql
id uuid primary key default gen_random_uuid()
project_id uuid references projects(id)
full_name text not null
phone text not null
email text
unit_preference text
nup_number integer
priority_order integer
status text default 'waiting' check (status in ('waiting', 'invited', 'converted', 'cancelled'))
registered_at date default CURRENT_DATE
invited_at date
notes text
assigned_to uuid references profiles(id)
created_by uuid references profiles(id)
created_at timestamptz default now()
```

### Tabel: `commissions`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id)
marketing_id uuid references profiles(id)
amount numeric not null
status text default 'pending' check (status in ('pending', 'approved', 'paid'))
approved_by uuid references profiles(id)
approved_at timestamptz
paid_at timestamptz
notes text
created_at timestamptz default now()
```

### Tabel: `handovers`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id)
unit_id uuid references units(id)
scheduled_date date
actual_date date
status text default 'scheduled' check (status in ('scheduled', 'done', 'rescheduled'))
checklist jsonb
defect_notes text
photos text[]
bast_generated_at timestamptz
bast_url text
created_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `notifications`
```sql
id uuid primary key default gen_random_uuid()
user_id uuid references profiles(id) not null
title text not null
body text
type text not null check (type in ('booking', 'kpr', 'prospect', 'commission', 'handover', 'general'))
link text
is_read boolean default false
created_at timestamptz default now()
```

### Tabel: `transaction_logs`
```sql
-- Log perubahan status/aksi penting (audit trail)
id uuid primary key default gen_random_uuid()
-- (kolom lengkap tidak didokumentasikan, lihat DB langsung)
```

---

## Row Level Security (RLS)

Aktifkan RLS di semua tabel.

```sql
-- Helper functions:
create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer;

create or replace function get_my_projects()
returns uuid[] as $$
  select project_ids from profiles where id = auth.uid()
$$ language sql security definer;
```

Logika umum:
- Marketing: SELECT/INSERT/UPDATE data milik sendiri (`assigned_to = auth.uid()`)
- Manager: SELECT/INSERT/UPDATE/DELETE semua data di project yang dia kelola
- Owner: SELECT semua (read only), tidak bisa INSERT/UPDATE/DELETE

**RPC SECURITY DEFINER** dipakai untuk bypass RLS di public pages:
- `get_booking_form_data(p_booking_code)` — fetch project + available units tanpa auth
- `submit_booking_request(...)` — insert booking_request tanpa auth
- `get_tracking_by_code(p_access_code)` — fetch tracking data konsumen tanpa auth

---

## Struktur Halaman & Routes

### Protected routes (perlu login):
| Path | Halaman | Role |
|---|---|---|
| `/` | Redirect ke dashboard sesuai role | — |
| `/dashboard/manager` | ManagerDashboard | manager, owner |
| `/dashboard/owner` | OwnerDashboard | owner |
| `/prospects` | ProspectListPage | marketing, manager |
| `/prospects/pipeline` | PipelinePage | marketing, manager |
| `/prospects/:id` | ProspectDetailPage | marketing, manager |
| `/units` | UnitListPage | semua |
| `/units/:id` | UnitDetailPage | semua |
| `/bookings` | BookingListPage | marketing, manager |
| `/bookings/:id` | BookingDetailPage | marketing, manager |
| `/booking-requests` | BookingRequestsPage | marketing, manager |
| `/kpr` | KprListPage | marketing, manager |
| `/kpr/:id` | KprDetailPage | marketing, manager |
| `/kpr/calculator` | KprCalculatorPage | semua |
| `/handovers` | HandoverListPage | semua |
| `/handovers/:id` | HandoverDetailPage | semua |
| `/commissions` | CommissionPage | semua |
| `/campaigns` | CampaignPage | marketing, manager |
| `/waitlist` | WaitlistPage | marketing, manager |
| `/reports` | ReportsPage | manager, owner |
| `/settings/profile` | ProfilePage | semua |
| `/settings/users` | UserManagementPage | owner |
| `/settings/project` | ProjectSettingsPage | manager |

### Public routes (tanpa login):
| Path | Halaman | Keterangan |
|---|---|---|
| `/booking/:code` | BookingFormPage | Form booking konsumen via short code |
| `/track/:code` | TrackingPage + TrackingDetailPage | Consumer tracking via access code |

---

## Supabase Client — Catatan Penting

```js
// src/lib/supabase.js
const isPublicPage = window.location.pathname.startsWith('/track') ||
                     window.location.pathname.startsWith('/booking/')

export const supabase = createClient(url, key, {
  auth: {
    persistSession: !isPublicPage,   // false di public pages
    autoRefreshToken: !isPublicPage, // false di public pages — cegah navigator.locks conflict
    detectSessionInUrl: false,
  },
})
```

Public pages menggunakan **plain fetch** (bukan supabase client) untuk:
- Upload file ke storage: `Authorization: Bearer {anonKey}` wajib disertakan
- Insert data: gunakan RPC SECURITY DEFINER, bukan direct table insert

---

## Struktur Folder

```
src/
├── components/
│   ├── ui/               # Button, Input, Modal, Badge, Skeleton, dll
│   └── layout/           # Sidebar, Navbar, PageWrapper
├── pages/
│   ├── auth/             # LoginPage
│   ├── dashboard/        # ManagerDashboard, OwnerDashboard
│   ├── prospects/        # ProspectListPage, ProspectDetailPage, PipelinePage
│   ├── units/            # UnitListPage, UnitDetailPage
│   ├── bookings/         # BookingListPage, BookingDetailPage
│   ├── booking-form/     # BookingFormPage (PUBLIC)
│   ├── booking-requests/ # BookingRequestsPage
│   ├── kpr/              # KprListPage, KprDetailPage, KprCalculatorPage
│   ├── handovers/        # HandoverListPage, HandoverDetailPage
│   ├── commissions/      # CommissionPage
│   ├── campaigns/        # CampaignPage
│   ├── waitlist/         # WaitlistPage
│   ├── reports/          # ReportsPage
│   ├── tracking/         # TrackingPage, TrackingDetailPage (PUBLIC)
│   └── settings/         # ProfilePage, UserManagementPage, ProjectSettingsPage
├── hooks/
│   ├── useAuth.js
│   ├── useProjects.js
│   ├── useProspects.js
│   ├── useUnits.js
│   ├── useBookings.js
│   ├── useKpr.js
│   ├── usePayments.js
│   ├── usePascaclosingChecklist.js
│   └── useNotifications.js
├── store/
│   └── authStore.js      # Zustand: auth session + profile + role
├── lib/
│   ├── supabase.js        # client + public page helpers (fetchBookingFormData, dll)
│   ├── utils.js           # formatDate, formatRupiah, generateAccessCode, dll
│   └── spr.js             # generate SPR PDF via jsPDF
└── routes/
    ├── index.jsx
    └── ProtectedRoute.jsx
```

---

## Konvensi Koding

- **Functional components + hooks** — tidak ada class component
- Setiap halaman fetch data sendiri via custom hook
- Supabase query selalu handle error — jangan biarkan error tanpa catch
- **Tailwind utility classes** only — tidak ada CSS file terpisah
- Nama file komponen: **PascalCase**; hooks/utils: **camelCase**
- Label UI dalam **Bahasa Indonesia**, variabel/fungsi dalam **Bahasa Inggris**
- State `mounted` dipakai di useEffect untuk menghindari setState setelah unmount
- Custom hooks punya `useEffect` untuk fetch saat mount + fungsi terpisah untuk manual refetch
- **StrictMode aktif** (`main.jsx`) — hati-hati dengan side effect di useEffect yang tidak idempotent

---

## Alur Auth & Routing

```
User buka app
  └── Belum login → /login
  └── Sudah login → cek role dari tabel profiles
        ├── role = 'owner'     → /dashboard/owner
        ├── role = 'manager'   → /dashboard/manager
        └── role = 'marketing' → /prospects
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://tmcactnakgupaemydtkz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Backlog / Fase 2

- **Portal konsumen dengan akun**: setelah booking disetujui manager, konsumen diundang buat akun. Portal tracking di-upgrade dengan fitur upload dokumen KPR (KTP, slip gaji, rekening koran, dll) yang bisa diverifikasi oleh sales.
- WhatsApp notifikasi otomatis
- Campaign analytics
- Modul konstruksi, RAB, keuangan proyek (Fase 3)
