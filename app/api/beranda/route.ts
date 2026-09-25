// app/api/beranda/route.ts
// Dipakai halaman Beranda guru. Query lewat service role di server, karena
// tabel guru/presensi memakai RLS tanpa policy anon (bukan Supabase Auth),
// jadi query langsung dari browser dengan anon key akan selalu kosong.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'guru') {
    return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan masuk kembali.' }, { status: 401 });
  }

  const { data: guru, error: errGuru } = await supabase
    .from('guru')
    .select('id, nama_lengkap, username, foto_profil_url, nip_nuptk')
    .eq('id', sesi.sub)
    .single();

  if (errGuru || !guru) {
    return NextResponse.json({ error: 'Data guru tidak ditemukan.' }, { status: 404 });
  }

  const hariIni = new Date().toISOString().slice(0, 10);
  const { data: presensi } = await supabase
    .from('presensi')
    .select('jenis, jam_tercatat, status_validasi')
    .eq('guru_id', sesi.sub)
    .eq('tanggal', hariIni)
    .eq('kategori', 'reguler');

  const datang = presensi?.find((p) => p.jenis === 'datang') ?? null;
  const pulang = presensi?.find((p) => p.jenis === 'pulang') ?? null;

  return NextResponse.json({ guru, datang, pulang });
}
