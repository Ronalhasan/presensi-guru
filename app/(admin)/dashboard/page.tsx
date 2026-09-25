'use client';

import { useEffect, useState } from 'react';

type Baris = {
  id: string;
  nama_guru: string;
  jenis: 'datang' | 'pulang';
  kategori: 'reguler' | 'penugasan';
  tanggal: string;
  jam_tercatat: string;
  foto_signed_url: string;
  status_validasi: string;
  diabsenkan_oleh_nama: string | null;
};

export default function DashboardAdminPage() {
  const [baris, setBaris] = useState<Baris[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muat() {
    setMemuat(true);
    const res = await fetch('/api/admin/presensi?status=menunggu');
    const data = await res.json();
    setBaris(data.data ?? []);
    setMemuat(false);
  }

  useEffect(() => {
    muat();
  }, []);

  async function validasi(id: string, status: 'valid' | 'ditolak') {
    setMemproses(id);
    await fetch('/api/admin/presensi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setBaris((b) => b.filter((x) => x.id !== id));
    setMemproses(null);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Validasi Presensi</h1>
      <p className="text-sm text-white/50">Presensi yang menunggu validasi, terlama di atas.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {memuat && <p className="text-sm text-white/40">Memuat…</p>}
        {!memuat && baris.length === 0 && (
          <p className="text-sm text-white/40">Tidak ada presensi yang menunggu validasi.</p>
        )}
        {baris.map((b) => (
          <div key={b.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-black/30">
              {b.foto_signed_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.foto_signed_url} alt={b.nama_guru} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-white/30">
                  Foto tidak tersedia
                </div>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold">{b.nama_guru}</p>
            <p className="text-xs capitalize text-white/50">
              {b.jenis} {b.kategori === 'penugasan' ? '· Penugasan' : ''} · {formatJam(b.jam_tercatat)}
            </p>
            {b.diabsenkan_oleh_nama && (
              <p className="text-xs text-purple-300">Diabsenkan oleh {b.diabsenkan_oleh_nama}</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => validasi(b.id, 'ditolak')}
                disabled={memproses === b.id}
                className="flex-1 rounded-xl border border-red-400/30 py-2 text-sm font-medium text-red-300 disabled:opacity-40"
              >
                Tolak
              </button>
              <button
                onClick={() => validasi(b.id, 'valid')}
                disabled={memproses === b.id}
                className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Valid
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
