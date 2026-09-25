-- =========================================================
-- Bootstrap akun admin PERTAMA
-- =========================================================
-- Belum ada cara di aplikasi untuk membuat akun admin pertama (ayam-telur:
-- untuk membuat guru butuh login admin, tapi belum ada admin sama sekali).
-- Jalankan SATU KALI di Supabase SQL Editor untuk membuat admin pertama.
--
-- pgcrypto's crypt(...,gen_salt('bf')) menghasilkan hash bcrypt standar
-- ($2a$/$2b$), yang formatnya SAMA dengan yang dipakai bcryptjs di kode
-- Next.js — jadi admin ini bisa langsung dipakai login dari aplikasi.
--
-- GANTI 'admin' dan 'ganti-kata-sandi-ini' di bawah sebelum menjalankan,
-- lalu setelah berhasil login, sebaiknya hapus baris ini dari riwayat SQL
-- Editor (kata sandi tidak tersimpan di kode, tapi lebih aman dihapus).

insert into admins (username, password_hash, nama)
values (
  'admin',
  crypt('admin123', gen_salt('bf')),
  'Admin Sekolah'
);
