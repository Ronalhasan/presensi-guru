// lib/attendance.ts
// Logika inti aturan jam presensi dan warna rekap.
// Semua perhitungan memakai jam SERVER (bukan jam HP guru).

export type JamKerja = {
  datang_mulai: string;        // "06:30"
  datang_tepat_hingga: string; // "07:15"
  datang_selesai: string;      // "14:00"
  pulang_mulai: string;        // "13:00"
  pulang_selesai: string;      // "18:00"
};

export const JAM_KERJA_DEFAULT: JamKerja = {
  datang_mulai: '06:30',
  datang_tepat_hingga: '07:15',
  datang_selesai: '14:00',
  pulang_mulai: '13:00',
  pulang_selesai: '18:00',
};

function keMenit(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export type HasilCekAbsen =
  | { boleh: false; alasan: string }
  | { boleh: true; terlambatMenit: number };

/**
 * Menentukan apakah absen DATANG boleh dilakukan pada jam tertentu,
 * dan berapa menit keterlambatannya.
 *
 * Aturan:
 * - Sebelum jam mulai  -> ditolak, belum dibuka.
 * - Setelah jam selesai (default 14:00) -> ditolak, sudah ditutup.
 * - Antara mulai dan batas tepat waktu -> tepat waktu, 0 menit terlambat.
 * - Setelah batas tepat waktu -> terlambat, dihitung sampai MIN(jam absen, jam selesai).
 *   Contoh: batas tepat 07:15, selesai 14:00. Absen jam 13:33 -> terlambat
 *   dari 07:15 sampai 13:33 (bukan dibatasi ke 13:00), karena batas
 *   penghitungan keterlambatan mengikuti jam_selesai absen datang.
 */
export function cekAbsenDatang(jamSekarang: Date, jk: JamKerja = JAM_KERJA_DEFAULT): HasilCekAbsen {
  const menitSekarang = jamSekarang.getHours() * 60 + jamSekarang.getMinutes();
  const mulai = keMenit(jk.datang_mulai);
  const tepat = keMenit(jk.datang_tepat_hingga);
  const selesai = keMenit(jk.datang_selesai);

  if (menitSekarang < mulai) {
    return { boleh: false, alasan: `Absen datang baru dibuka pukul ${jk.datang_mulai}.` };
  }
  if (menitSekarang > selesai) {
    return { boleh: false, alasan: `Absen datang sudah ditutup. Batas terakhir pukul ${jk.datang_selesai}.` };
  }
  if (menitSekarang <= tepat) {
    return { boleh: true, terlambatMenit: 0 };
  }
  const terlambatMenit = Math.min(menitSekarang, selesai) - tepat;
  return { boleh: true, terlambatMenit };
}

/**
 * Menentukan apakah absen PULANG boleh dilakukan pada jam tertentu.
 * Tidak ada konsep "terlambat" untuk absen pulang, hanya boleh/tidak.
 */
export function cekAbsenPulang(jamSekarang: Date, jk: JamKerja = JAM_KERJA_DEFAULT): HasilCekAbsen {
  const menitSekarang = jamSekarang.getHours() * 60 + jamSekarang.getMinutes();
  const mulai = keMenit(jk.pulang_mulai);
  const selesai = keMenit(jk.pulang_selesai);

  if (menitSekarang < mulai) {
    return { boleh: false, alasan: `Absen pulang baru dibuka pukul ${jk.pulang_mulai}.` };
  }
  if (menitSekarang > selesai) {
    return { boleh: false, alasan: `Absen pulang sudah ditutup. Batas terakhir pukul ${jk.pulang_selesai}.` };
  }
  return { boleh: true, terlambatMenit: 0 };
}

export function formatMenit(menit: number): string {
  if (menit <= 0) return '0 menit';
  const j = Math.floor(menit / 60);
  const m = menit % 60;
  if (j === 0) return `${m} menit`;
  if (m === 0) return `${j} jam`;
  return `${j} jam ${m} menit`;
}

// -----------------------------------------------------------
// Warna rekap harian
// -----------------------------------------------------------

export type WarnaSel = 'tanpa' | 'coklat_muda' | 'coklat' | 'coklat_tua';

export const WARNA_HEX: Record<WarnaSel, string | null> = {
  tanpa: null,
  coklat_muda: 'FFDCC39A', // ARGB untuk ExcelJS
  coklat: 'FFA9713F',
  coklat_tua: 'FF5A3418',
};

export type RingkasanHari = {
  terlambatMenit: number;   // 0 jika tidak terlambat / tidak absen datang dianggap kasus lain
  absenPulangValid: boolean;
};

/**
 * Aturan warna (sesuai kesepakatan final):
 * - Tepat waktu + absen pulang            -> tanpa warna
 * - Tidak terlambat, TIDAK absen pulang   -> coklat muda
 * - Terlambat, absen pulang               -> coklat
 * - Terlambat DAN tidak absen pulang      -> coklat tua
 */
export function warnaHari({ terlambatMenit, absenPulangValid }: RingkasanHari): WarnaSel {
  const terlambat = terlambatMenit > 0;
  if (terlambat && !absenPulangValid) return 'coklat_tua';
  if (terlambat && absenPulangValid) return 'coklat';
  if (!terlambat && !absenPulangValid) return 'coklat_muda';
  return 'tanpa';
}

/** Teks singkat yang ditulis di dalam sel Excel, di atas warna latar. */
export function labelSel({ terlambatMenit, absenPulangValid }: RingkasanHari): string {
  const bagian: string[] = [];
  if (terlambatMenit > 0) bagian.push(`T ${formatMenit(terlambatMenit)}`);
  if (!absenPulangValid) bagian.push('TP');
  return bagian.join(' · ') || 'Hadir';
}
