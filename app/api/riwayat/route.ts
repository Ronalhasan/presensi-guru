// app/api/riwayat/route.ts
// Dipakai halaman Riwayat guru — lihat catatan di app/api/beranda/route.ts
// soal kenapa ini lewat API server, bukan query langsung dari browser.

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET() {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'guru') {
    return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan masuk kembali.' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('presensi')
    .select('id, tanggal, jenis, kategori, jam_tercatat, status_validasi, diabsenkan_oleh_guru_id')
    .eq('guru_id', sesi.sub)
    .order('tanggal', { ascending: false })
    .order('jam_tercatat', { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
