// app/api/admin/presensi/route.ts
// GET  ?status=menunggu|valid|ditolak|semua  -> daftar presensi + foto (signed URL,
//      karena bucket foto-presensi bersifat private). 'semua' = tanpa filter status.
// PATCH { id, status: 'valid' | 'ditolak' } -> validasi oleh admin yang login

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const MASA_BERLAKU_URL_FOTO = 300; // detik

export async function GET(req: NextRequest) {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get('status') ?? 'menunggu';

  let query = supabase
    .from('presensi')
    .select(
      'id, jenis, kategori, tanggal, jam_tercatat, foto_url, status_validasi, ' +
        'guru:guru_id(nama_lengkap), diabsenkan_oleh:diabsenkan_oleh_guru_id(nama_lengkap)'
    );

  if (status !== 'semua') {
    query = query.eq('status_validasi', status);
  }

  // Antrean "menunggu" ditampilkan terlama dulu (FIFO, biar tidak ada yang
  // kelewat lama nunggu); tab lain (valid/ditolak/semua) ditampilkan
  // terbaru dulu, karena itu lebih berguna untuk riwayat.
  const { data, error } = await query.order('jam_tercatat', { ascending: status === 'menunggu' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hasil = await Promise.all(
    (data ?? []).map(async (b: any) => {
      const { data: signed } = await supabase.storage
        .from('foto-presensi')
        .createSignedUrl(b.foto_url, MASA_BERLAKU_URL_FOTO);
      return {
        id: b.id,
        nama_guru: b.guru?.nama_lengkap ?? '(tidak diketahui)',
        jenis: b.jenis,
        kategori: b.kategori,
        tanggal: b.tanggal,
        jam_tercatat: b.jam_tercatat,
        status_validasi: b.status_validasi,
        diabsenkan_oleh_nama: b.diabsenkan_oleh?.nama_lengkap ?? null,
        foto_signed_url: signed?.signedUrl ?? '',
      };
    })
  );

  return NextResponse.json({ data: hasil });
}

export async function PATCH(req: NextRequest) {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'admin') {
    return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });
  }

  let body: { id?: string; status?: string; catatan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  if (!body.id || (body.status !== 'valid' && body.status !== 'ditolak')) {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('presensi')
    .update({
      status_validasi: body.status,
      divalidasi_oleh_admin_id: sesi.sub,
      divalidasi_pada: new Date().toISOString(),
      catatan_admin: body.catatan ?? null,
    })
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}