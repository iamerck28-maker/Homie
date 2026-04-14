# Homie — Project Context

## Tentang Produk
Homie adalah platform manajemen marketing developer properti Indonesia. Fokus pada alur lengkap dari iklan pertama sampai unit selesai diserahterimakan. Target pengguna: developer perumahan kecil-menengah dengan 1–5 project aktif.

Ini adalah **Fase 1 (MVP)** — fokus pada modul marketing saja. Modul konstruksi, RAB, dan keuangan proyek akan dibangun di fase berikutnya.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + password) |
| Hosting | Vercel |
| PDF Generate | react-pdf atau jsPDF |
| State Management | Zustand |
| Routing | React Router v6 |

---

## 3 Role Pengguna

### 1. Marketing / Sales
- Input dan kelola data prospek milik sendiri
- Update status unit (hold/available)
- Input booking, cetak SPR PDF
- Checklist dokumen KPR per pembeli
- Update status pengajuan bank
- Lihat reminder follow-up harian
- Kalkulator simulasi KPR
- Lihat komisi earned milik sendiri (read only)
- **Tidak bisa** hapus data apapun
- **Hanya bisa edit** data yang dia sendiri buat

### 2. Manager Marketing
- Semua akses Marketing
- Edit dan hapus data seluruh anggota tim marketing
- Assign/pindahkan prospek antar sales
- Pantau performa per sales (closing rate, pipeline)
- Approve komisi tim sebelum dibayar
- Setup dan edit template dokumen (SPR, BAST)
- Setup project baru, input data unit, set harga
- Ekspor laporan (prospek, closing, KPR) per periode
- **Tidak bisa** lihat dashboard konsolidasi semua project (itu hak owner)
- **Tidak bisa** tambah atau hapus akun user

### 3. Owner
- Dashboard konsolidasi semua project sekaligus
- Bandingkan performa antar project
- Pantau performa per manager
- Lihat status KPR global (berapa pending, berapa akad bulan ini)
- Analisis sumber lead terbaik per project
- Tambah dan hapus akun user (marketing & manager)
- **Hanya baca** — tidak bisa edit, hapus, atau input data operasional apapun

---

## Tabel Permission Detail

| Aksi | Marketing | Manager | Owner |
|---|---|---|---|
| Input prospek baru | ✓ | ✓ | ✗ |
| Edit data prospek | Milik sendiri | Seluruh tim | ✗ |
| Hapus data prospek | ✗ | ✓ | ✗ |
| Input booking unit | ✓ | ✓ | ✗ |
| Generate SPR / BAST | ✓ | ✓ | ✗ |
| Edit template dokumen | ✗ | ✓ | ✗ |
| Approve komisi sales | ✗ | ✓ | ✗ |
| Lihat komisi sendiri | ✓ | ✓ | ✗ |
| Dashboard performa tim | ✗ | ✓ | ✓ |
| Dashboard konsolidasi semua project | ✗ | ✗ | ✓ |
| Setup project & harga unit | ✗ | ✓ | ✗ |
| Tambah / hapus akun user | ✗ | ✗ | ✓ |

---

## Database Schema (Supabase / PostgreSQL)

### Tabel: `profiles`
```sql
id uuid references auth.users primary key
full_name text not null
role text not null check (role in ('marketing', 'manager', 'owner'))
project_ids uuid[] -- project yang bisa diakses (null = semua, untuk owner)
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
prospect_id uuid references prospects(id)
unit_id uuid references units(id) not null
project_id uuid references projects(id) not null
buyer_name text not null
buyer_phone text
buyer_email text
buyer_nik text
booking_fee numeric
booking_date date not null
payment_method text check (payment_method in ('kpr', 'cash', 'cash_bertahap'))
notes text
spr_generated_at timestamptz
spr_url text
created_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `kpr_tracking`
```sql
id uuid primary key default gen_random_uuid()
booking_id uuid references bookings(id) on delete cascade
bank_name text not null
status text default 'dokumen' check (status in ('dokumen', 'ojk', 'appraisal', 'sp3k', 'akad', 'cair', 'ditolak'))
submission_date date
sp3k_date date
akad_date date
notes text
updated_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Tabel: `kpr_documents`
```sql
id uuid primary key default gen_random_uuid()
kpr_tracking_id uuid references kpr_tracking(id) on delete cascade
doc_name text not null
is_complete boolean default false
due_date date
notes text
updated_by uuid references profiles(id)
updated_at timestamptz default now()
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

---

## Row Level Security (RLS) — Aturan Akses Data

Aktifkan RLS di semua tabel. Berikut logika utama:

```sql
-- Marketing: hanya bisa lihat/edit data milik sendiri atau yang di-assign ke dia
-- Manager: bisa lihat/edit semua data di project yang dia kelola
-- Owner: bisa lihat semua data (read only), tidak bisa insert/update/delete

-- Contoh untuk tabel prospects:
-- SELECT: marketing bisa lihat jika assigned_to = auth.uid()
--         manager bisa lihat jika project_id ada di project yang dia manage
--         owner bisa lihat semua
-- INSERT: marketing dan manager bisa insert
--         owner tidak bisa insert
-- UPDATE: marketing bisa update jika assigned_to = auth.uid()
--         manager bisa update semua di projectnya
--         owner tidak bisa update
-- DELETE: hanya manager yang bisa delete
```

Implementasi RLS menggunakan helper function:
```sql
create or replace function get_my_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer;

create or replace function get_my_projects()
returns uuid[] as $$
  select project_ids from profiles where id = auth.uid()
$$ language sql security definer;
```

---

## Struktur Folder Project

```
proptrack/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/               # komponen reusable (Button, Input, Modal, Badge, dll)
│   │   ├── layout/           # Sidebar, Navbar, PageWrapper
│   │   └── shared/           # komponen yang dipakai di banyak modul
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx
│   │   ├── dashboard/
│   │   │   ├── OwnerDashboard.jsx
│   │   │   └── ManagerDashboard.jsx
│   │   ├── units/
│   │   │   ├── UnitListPage.jsx
│   │   │   └── UnitDetailPage.jsx
│   │   ├── prospects/
│   │   │   ├── ProspectListPage.jsx
│   │   │   ├── ProspectDetailPage.jsx
│   │   │   └── PipelinePage.jsx
│   │   ├── bookings/
│   │   │   ├── BookingListPage.jsx
│   │   │   └── BookingDetailPage.jsx
│   │   ├── kpr/
│   │   │   ├── KprListPage.jsx
│   │   │   └── KprDetailPage.jsx
│   │   ├── commissions/
│   │   │   └── CommissionPage.jsx
│   │   ├── handovers/
│   │   │   └── HandoverPage.jsx
│   │   └── settings/
│   │       ├── ProfilePage.jsx
│   │       └── UserManagementPage.jsx  (owner only)
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   ├── useProspects.js
│   │   └── useUnits.js
│   ├── store/
│   │   └── authStore.js       # Zustand store untuk auth & user profile
│   ├── lib/
│   │   ├── supabase.js        # inisialisasi Supabase client
│   │   └── utils.js           # helper functions
│   ├── routes/
│   │   ├── index.jsx          # semua route definitions
│   │   └── ProtectedRoute.jsx # guard berdasarkan role
│   └── main.jsx
├── .env.local                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── context.md                 # file ini
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Alur Auth & Routing

```
User buka app
  └── Belum login → /login
  └── Sudah login → cek role dari tabel profiles
        ├── role = 'owner'   → /dashboard/owner
        ├── role = 'manager' → /dashboard/manager
        └── role = 'marketing' → /prospects (pipeline view)

ProtectedRoute logic:
  - Cek apakah user sudah login (Supabase session)
  - Cek role dari profiles table
  - Jika role tidak punya akses ke route tersebut → redirect ke halaman utama role-nya
  - Contoh: marketing coba akses /settings/users → redirect ke /prospects
```

---

## Urutan Build (Fase 1 MVP)

Ikuti urutan ini — setiap langkah bergantung pada langkah sebelumnya:

1. **Setup project** — Vite + React + Tailwind + Supabase client + Zustand
2. **Database** — Buat semua tabel di Supabase, aktifkan RLS, buat helper functions
3. **Auth** — LoginPage, useAuth hook, authStore (simpan user + role), ProtectedRoute
4. **Layout** — Sidebar (menu berbeda per role), Navbar, PageWrapper
5. **Master Unit** — UnitListPage, tambah/edit unit, update status
6. **CRM Prospek** — ProspectListPage, tambah prospek, PipelinePage (kanban), ProspectDetailPage + activity log + reminder
7. **Booking** — BookingListPage, form booking, generate SPR PDF
8. **KPR Tracker** — KprListPage, checklist dokumen, update status bank per pembeli
9. **Dashboard** — ManagerDashboard (performa tim), OwnerDashboard (konsolidasi semua project)
10. **Settings** — ProfilePage, UserManagementPage (owner only)

---

## Konvensi Koding

- Gunakan **functional components** dan **hooks** — tidak ada class component
- Setiap halaman fetch data sendiri via custom hook (bukan di component langsung)
- Supabase query selalu handle error — jangan biarkan error tanpa catch
- Gunakan **Tailwind utility classes** — tidak ada CSS file terpisah kecuali untuk global styles
- Nama file komponen: **PascalCase** (contoh: `ProspectCard.jsx`)
- Nama file hooks/utils: **camelCase** (contoh: `useProspects.js`)
- Semua string label/status dalam **Bahasa Indonesia** di UI, tapi nama variabel/fungsi dalam **Bahasa Inggris**
- Gunakan **uuid** untuk semua primary key — bukan integer auto-increment

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://tmcactnakgupaemydtkz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Catatan Penting

- **Fase 1 ini hanya modul marketing** — jangan build RAB, material, atau laporan keuangan proyek dulu
- Semua fitur WhatsApp notifikasi dan campaign analytics masuk **Fase 2**
- Serah terima (handover) boleh dipersiapkan tabelnya tapi UI-nya masuk **Fase 2**
- Mobile-responsive wajib dari awal — banyak pengguna akses via HP
- **Owner tidak bisa edit data apapun** — pastikan ini diterapkan di RLS dan di UI (sembunyikan tombol edit/hapus untuk role owner)
- **Marketing tidak bisa hapus data apapun** — hanya bisa edit data milik sendiri

---

## Referensi Produk Kompetitor (untuk inspirasi UX)

- **Mandep** (mandep.id) — fokus konstruksi, UI cukup sederhana
- **ERP360** (properti.erp360.id) — fitur sales & booking paling lengkap di kompetitor
- **Proads** (proads.tech) — paling simpel, bagus untuk referensi onboarding yang mudah

Homie harus lebih ringan dari ERP360 tapi lebih lengkap dari Proads, dengan keunggulan di CRM prospek dan KPR tracker yang tidak ada di kompetitor manapun.
