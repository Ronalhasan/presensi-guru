// app/api/rekap/export/route.ts
// Endpoint admin: GET /api/rekap/export?bulan=2026-09
// Menghasilkan file .xlsx rekap kehadiran satu bulan, dengan warna sel
// sesuai aturan yang disepakati (lihat lib/attendance.ts).

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import { warnaHari, labelSel, WARNA_HEX, hitungTerlambatMenit } from '@/lib/attendance';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: endpoint ini hanya boleh dipanggil oleh admin
);

function jumlahHariDiBulan(tahun: number, bulan1to12: number) {
  return new Date(tahun, bulan1to12, 0).getDate();
}

export async function GET(req: NextRequest) {
  const admin = await getAdminDariSesi();
  if (!admin) {
    return NextResponse.json({ error: 'Hanya admin yang boleh mengekspor rekap.' }, { status: 401 });
  }

  const bulanParam = req.nextUrl.searchParams.get('bulan'); // "2026-09"
  if (!bulanParam || !/^\d{4}-\d{2}$/.test(bulanParam)) {
    return NextResponse.json({ error: 'Parameter bulan tidak valid. Gunakan format YYYY-MM.' }, { status: 400 });
  }
  const [tahun, bulan] = bulanParam.split('-').map(Number);
  const jumlahHari = jumlahHariDiBulan(tahun, bulan);
  const tglAwal = `${bulanParam}-01`;
  const tglAkhir = `${bulanParam}-${String(jumlahHari).padStart(2, '0')}`;

  // Ambil semua guru aktif
  const { data: daftarGuru, error: errGuru } = await supabase
    .from('guru')
    .select('id, nama_lengkap')
    .eq('aktif', true)
    .order('nama_lengkap');
  if (errGuru) {
    return NextResponse.json({ error: errGuru.message }, { status: 500 });
  }

  // Ambil semua presensi REGULER yang valid di rentang bulan itu
  const { data: presensi, error: errPresensi } = await supabase
    .from('presensi')
    .select('guru_id, tanggal, jenis, jam_tercatat, status_validasi, kategori')
    .eq('kategori', 'reguler')
    .eq('status_validasi', 'valid')
    .gte('tanggal', tglAwal)
    .lte('tanggal', tglAkhir);
  if (errPresensi) {
    return NextResponse.json({ error: errPresensi.message }, { status: 500 });
  }

  // Ambil aturan jam kerja yang berlaku (baris terbaru <= tglAkhir)
  const { data: jkRows } = await supabase
    .from('jam_kerja')
    .select('*')
    .lte('berlaku_sejak', tglAkhir)
    .order('berlaku_sejak', { ascending: false })
    .limit(1);
  const jk = jkRows?.[0] ?? {
    datang_tepat_hingga: '07:15',
    datang_selesai: '14:00',
  };

  // Susun peta: guru_id -> tanggal -> { datang?, pulang? }
  type Baris = { datangJam?: Date; pulangAda?: boolean };
  const peta = new Map<string, Map<string, Baris>>();
  for (const g of daftarGuru) peta.set(g.id, new Map());

  for (const p of presensi) {
    const perGuru = peta.get(p.guru_id);
    if (!perGuru) continue;
    const existing = perGuru.get(p.tanggal) ?? {};
    if (p.jenis === 'datang') existing.datangJam = new Date(p.jam_tercatat);
    if (p.jenis === 'pulang') existing.pulangAda = true;
    perGuru.set(p.tanggal, existing);
  }

  // Aturan jam kerja dipakai langsung lewat hitungTerlambatMenit() di bawah,
  // yang membaca jam dalam zona sekolah (WITA) — bukan jam server (UTC).

  // --- Bangun workbook ---
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Aplikasi Presensi Guru — Yayasan Al Husna Popayato';
  const ws = wb.addWorksheet(`Rekap ${bulanParam}`);

  const headerRow = ['Nama Guru', ...Array.from({ length: jumlahHari }, (_, i) => String(i + 1))];
  ws.addRow(headerRow);
  ws.getRow(1).font = { bold: true };
  ws.getColumn(1).width = 28;
  for (let c = 2; c <= jumlahHari + 1; c++) ws.getColumn(c).width = 9;

  let totalTerlambatSemua = 0;

  for (const g of daftarGuru) {
    const rowValues: (string | number)[] = [g.nama_lengkap];
    let totalTerlambatGuru = 0;

    for (let d = 1; d <= jumlahHari; d++) {
      const tgl = `${bulanParam}-${String(d).padStart(2, '0')}`;
      const hari = peta.get(g.id)?.get(tgl);

      if (!hari?.datangJam) {
        rowValues.push(''); // tidak ada presensi valid hari itu sama sekali (alfa/libur)
        continue;
      }

      const terlambatMenit = hitungTerlambatMenit(hari.datangJam, jk);
      const absenPulangValid = !!hari.pulangAda;

      totalTerlambatGuru += terlambatMenit;
      rowValues.push(labelSel({ terlambatMenit, absenPulangValid }));
    }

    totalTerlambatSemua += totalTerlambatGuru;
    const row = ws.addRow([...rowValues, `Total terlambat: ${totalTerlambatGuru} menit`]);

    // Warnai tiap sel hari sesuai aturan
    for (let d = 1; d <= jumlahHari; d++) {
      const tgl = `${bulanParam}-${String(d).padStart(2, '0')}`;
      const hari = peta.get(g.id)?.get(tgl);
      const cell = row.getCell(d + 1);
      if (!hari?.datangJam) continue;

      const terlambatMenit = hitungTerlambatMenit(hari.datangJam, jk);
      const warna = warnaHari({ terlambatMenit, absenPulangValid: !!hari.pulangAda });
      const argb = WARNA_HEX[warna];
      if (argb) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
        cell.font = { color: { argb: warna === 'coklat_muda' ? 'FF3A2812' : 'FFFFFFFF' } };
      }
    }
  }

  // Baris keterangan warna
  ws.addRow([]);
  const ket = ws.addRow(['Keterangan warna:']);
  ket.font = { italic: true };
  const tambahKeterangan = (label: string, argb: string | null) => {
    const r = ws.addRow([label]);
    if (argb) r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
  };
  tambahKeterangan('Tanpa warna — tepat waktu, absen pulang', null);
  tambahKeterangan('Coklat muda — tidak terlambat, tidak absen pulang', WARNA_HEX.coklat_muda);
  tambahKeterangan('Coklat — terlambat, absen pulang', WARNA_HEX.coklat);
  tambahKeterangan('Coklat tua — terlambat dan tidak absen pulang', WARNA_HEX.coklat_tua);

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rekap-presensi-${bulanParam}.xlsx"`,
    },
  });
}

// Sama seperti endpoint admin lainnya: cek cookie sesi JWT dan pastikan role === 'admin'.
async function getAdminDariSesi(): Promise<{ id: string } | null> {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'admin') return null;
  return { id: sesi.sub };
}