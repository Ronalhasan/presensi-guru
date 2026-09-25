-- =========================================================
-- Skema Supabase: Aplikasi Presensi Guru
-- Yayasan Al Husna Popayato
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Akun admin (berdiri sendiri, terpisah dari akun guru)
-- ---------------------------------------------------------
create table admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  nama text not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Akun guru (juga dipakai oleh kepala sekolah, jenis sama)
-- ---------------------------------------------------------
create table guru (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  nama_lengkap text not null,
  nip_nuptk text,
  foto_profil_url text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  dibuat_oleh_admin_id uuid references admins(id)
);

-- ---------------------------------------------------------
-- Aturan jam kerja, disimpan di DB agar bisa diubah admin
-- tanpa perlu ubah kode aplikasi. Baris dengan berlaku_sejak
-- terbaru yang <= hari ini yang dipakai.
-- ---------------------------------------------------------
create table jam_kerja (
  id uuid primary key default gen_random_uuid(),
  berlaku_sejak date not null default current_date,
  datang_mulai time not null default '06:30',
  datang_tepat_hingga time not null default '07:15',
  datang_selesai time not null default '14:00',
  pulang_mulai time not null default '13:00',
  pulang_selesai time not null default '18:00',
  created_at timestamptz not null default now()
);

insert into jam_kerja default values;

-- ---------------------------------------------------------
-- Presensi: satu baris per kejadian absen (datang / pulang),
-- termasuk presensi penugasan dan presensi yang diabsenkan
-- lewat fitur "Presensikan Teman".
-- ---------------------------------------------------------
create table presensi (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null references guru(id),
  tanggal date not null,
  jenis text not null check (jenis in ('datang','pulang')),
  kategori text not null default 'reguler' check (kategori in ('reguler','penugasan')),
  jam_tercatat timestamptz not null default now(),   -- jam SERVER, bukan jam HP
  foto_url text not null,
  diabsenkan_oleh_guru_id uuid references guru(id),  -- null jika absen sendiri
  status_validasi text not null default 'menunggu'
    check (status_validasi in ('menunggu','valid','ditolak')),
  divalidasi_oleh_admin_id uuid references admins(id),
  divalidasi_pada timestamptz,
  catatan_admin text,
  created_at timestamptz not null default now(),

  -- satu guru hanya boleh satu baris datang/pulang reguler valid+menunggu per hari
  constraint presensi_unik_per_hari
    unique (guru_id, tanggal, jenis, kategori)
);

create index idx_presensi_guru_tanggal on presensi (guru_id, tanggal);
create index idx_presensi_status on presensi (status_validasi);

-- ---------------------------------------------------------
-- Row Level Security dasar. Kebijakan detail (mis. guru hanya
-- boleh baca presensi dirinya sendiri) disesuaikan lagi saat
-- auth Supabase (guru/admin) sudah dihubungkan.
-- ---------------------------------------------------------
alter table admins enable row level security;
alter table guru enable row level security;
alter table presensi enable row level security;
alter table jam_kerja enable row level security;
