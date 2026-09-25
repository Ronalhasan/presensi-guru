# Presensi Guru — Yayasan Al Husna Popayato

Aplikasi presensi guru berbasis Next.js + Supabase, dengan validasi wajah oleh
admin dan ekspor rekap kehadiran ke Excel (warna sel otomatis).

## Struktur proyek

```
app/
  page.tsx                      -> redirect sementara ke /beranda
  layout.tsx                    -> root layout + Tailwind
  (guru)/
    layout.tsx                  -> tema gelap + bottom nav
    beranda/page.tsx            -> kartu profil, status hari ini, menu
    absen/page.tsx              -> kamera + kirim presensi
    riwayat/page.tsx            -> riwayat presensi guru
    teman/page.tsx              -> cari & presensikan teman
  api/
    presensi/route.ts           -> POST terima presensi (foto + jam server)
    rekap/export/route.ts       -> GET ekspor rekap bulanan ke .xlsx
components/
  BottomNav.tsx
lib/
  supabaseClient.ts             -> klien Supabase sisi browser
  attendance.ts                 -> aturan jam & warna rekap
sql/
  schema.sql                    -> skema tabel Supabase
```

## Belum ada di proyek ini (langkah berikutnya)

- Halaman login & dashboard guru/admin
- Endpoint validasi admin (Valid/Tolak) + kelola akun guru
- Fungsi `getGuruDariSesi` dan `getAdminDariSesi` di kedua `route.ts` masih
  placeholder — harus diganti dengan pengecekan sesi login sungguhan.

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi dengan kredensial Supabase Bapak
npm run dev
```

## Setup Supabase (sekali saja)

1. Buat proyek baru di supabase.com.
2. Buka SQL Editor, jalankan isi `sql/schema.sql`.
3. Buka Storage, buat bucket baru bernama persis `foto-presensi` (Private).
4. Buka Project Settings > API, salin `Project URL`, `anon public` key, dan
   `service_role` key untuk langkah berikutnya.

## Deploy ke Vercel

1. Push folder ini ke repo GitHub baru (lihat langkah di bawah).
2. Di vercel.com, klik "Add New Project", pilih repo tersebut.
3. Sebelum klik Deploy, buka Environment Variables, isi 4 variable ini:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik Deploy.

## Push ke GitHub dari nol

```bash
git init
git add .
git commit -m "Proyek awal: presensi guru"
git branch -M main
git remote add origin https://github.com/USERNAME/presensi-guru.git
git push -u origin main
```

Ganti `USERNAME` dan buat dulu repo kosong bernama `presensi-guru` di GitHub
sebelum menjalankan `git push`.
