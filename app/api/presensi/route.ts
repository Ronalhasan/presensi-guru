// app/api/presensi/route.ts
// Endpoint guru: POST /api/presensi
// Body (multipart/form-data):
//   jenis: "datang" | "pulang"
//   kategori: "reguler" | "penugasan"
//   guru_id_target: id guru yang diabsenkan (untuk "Presensikan Teman")
//   foto: file gambar wajah

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cekAbsenDatang, cekAbsenPulang, JamKerja, JAM_KERJA_DEFAULT, tanggalDalamZonaSekolah } from '@/lib/attendance';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const pengirim = await getGuruDariSesi(req); // guru yang sedang login
  if (!pengirim) {
    return NextResponse.json({ error: 'Sesi tidak ditemukan. Silakan masuk kembali.' }, { status: 401 });
  }

  const form = await req.formData();
  const jenis = form.get('jenis');
  const kategori = (form.get('kategori') as string) || 'reguler';
  const guruIdTarget = (form.get('guru_id_target') as string) || pengirim.id; // default: absen sendiri
  const foto = form.get('foto') as File | null;

  if (jenis !== 'datang' && jenis !== 'pulang') {
    return NextResponse.json({ error: 'Jenis presensi tidak valid.' }, { status: 400 });
  }
  if (!foto) {
    return NextResponse.json({ error: 'Foto wajah wajib disertakan untuk validasi admin.' }, { status: 400 });
  }

  // Jam SERVER, bukan jam perangkat pengirim — mencegah manipulasi jam HP.
  const sekarang = new Date();

  const jk: JamKerja = (await ambilJamKerjaAktif()) ?? JAM_KERJA_DEFAULT;
  const hasilCek = jenis === 'datang' ? cekAbsenDatang(sekarang, jk) : cekAbsenPulang(sekarang, jk);
  if (!hasilCek.boleh) {
    return NextResponse.json({ error: hasilCek.alasan }, { status: 422 });
  }

  const tanggal = tanggalDalamZonaSekolah(sekarang);

  // Unggah foto ke Supabase Storage
  const namaFile = `${guruIdTarget}/${tanggal}-${jenis}-${kategori}-${Date.now()}.jpg`;
  const { error: errUpload } = await supabase.storage
    .from('foto-presensi')
    .upload(namaFile, await foto.arrayBuffer(), { contentType: foto.type || 'image/jpeg' });
  if (errUpload) {
    return NextResponse.json({ error: 'Gagal mengunggah foto: ' + errUpload.message }, { status: 500 });
  }
  // Bucket foto-presensi bersifat PRIVATE, jadi yang disimpan adalah path
  // di storage (bukan public URL, yang tidak akan bisa diakses). URL yang
  // bisa dibuka dibuatkan belakangan lewat createSignedUrl() saat admin
  // membuka dashboard validasi — lihat app/api/admin/presensi/route.ts.
  const pathFoto = namaFile;

  const diabsenkanOlehOrangLain = guruIdTarget !== pengirim.id;

  const { data, error } = await supabase
    .from('presensi')
    .insert({
      guru_id: guruIdTarget,
      tanggal,
      jenis,
      kategori,
      jam_tercatat: sekarang.toISOString(),
      foto_url: pathFoto,
      diabsenkan_oleh_guru_id: diabsenkanOlehOrangLain ? pengirim.id : null,
      status_validasi: 'menunggu',
    })
    .select()
    .single();

  if (error) {
    // Kemungkinan besar: sudah pernah absen jenis+kategori itu di tanggal yang sama
    if (error.code === '23505') {
      return NextResponse.json(
        { error: `Presensi ${jenis} untuk tanggal ini sudah tercatat sebelumnya.` },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pesan = 'terlambatMenit' in hasilCek && hasilCek.terlambatMenit > 0
    ? `Terkirim. Tercatat terlambat ${hasilCek.terlambatMenit} menit. Menunggu validasi admin.`
    : 'Terkirim. Menunggu validasi admin.';

  return NextResponse.json({ ok: true, presensi: data, pesan });
}

async function ambilJamKerjaAktif(): Promise<JamKerja | null> {
  const hariIni = tanggalDalamZonaSekolah();
  const { data } = await supabase
    .from('jam_kerja')
    .select('*')
    .lte('berlaku_sejak', hariIni)
    .order('berlaku_sejak', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function getGuruDariSesi(_req: NextRequest): Promise<{ id: string } | null> {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'guru') return null;
  return { id: sesi.sub };
}