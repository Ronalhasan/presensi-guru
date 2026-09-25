'use client';

import { useState } from 'react';

function bulanIni() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function RekapAdminPage() {
  const [bulan, setBulan] = useState(bulanIni());
  const [mengunduh, setMengunduh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unduh() {
    setMengunduh(true);
    setError(null);
    try {
      const res = await fetch(`/api/rekap/export?bulan=${bulan}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Gagal mengunduh rekap.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rekap-presensi-${bulan}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setMengunduh(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Rekap Presensi</h1>
      <p className="text-sm text-white/50">
        Unduh rekap kehadiran satu bulan dalam bentuk Excel, lengkap dengan warna keterangan
        terlambat dan tidak absen pulang.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <label className="text-xs uppercase tracking-wide text-white/50">Pilih bulan</label>
        <input
          type="month"
          value={bulan}
          onChange={(e) => setBulan(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none"
        />

        {error && (
          <div className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          onClick={unduh}
          disabled={mengunduh}
          className="mt-4 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {mengunduh ? 'Menyiapkan file…' : 'Unduh Rekap (.xlsx)'}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">Keterangan warna</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-white/20" /> Tanpa warna — tepat waktu, absen pulang
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#DCC39A' }} /> Coklat muda — tidak
            terlambat, tidak absen pulang
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#A9713F' }} /> Coklat — terlambat, absen
            pulang
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: '#5A3418' }} /> Coklat tua — terlambat dan
            tidak absen pulang
          </li>
        </ul>
      </div>
    </div>
  );
}