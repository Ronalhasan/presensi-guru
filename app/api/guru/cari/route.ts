// app/api/guru/cari/route.ts
// Dipakai halaman "Presensikan Teman" untuk mencari nama guru lain.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'guru') {
    return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan masuk kembali.' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q) return NextResponse.json({ data: [] });

  const { data, error } = await supabase
    .from('guru')
    .select('id, nama_lengkap, nip_nuptk, foto_profil_url')
    .eq('aktif', true)
    .neq('id', sesi.sub)
    .ilike('nama_lengkap', `%${q}%`)
    .order('nama_lengkap')
    .limit(15);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}
