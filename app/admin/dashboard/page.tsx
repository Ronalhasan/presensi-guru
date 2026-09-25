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
  status_validasi: 'menunggu' | 'valid' | 'ditolak';
  diabsenkan_oleh_nama: string | null;
};

type TabStatus = 'menunggu' | 'valid' | 'ditolak' | 'semua';

const TABS: { key: TabStatus; label: string }[] = [
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'valid', label: 'Valid' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: 'semua', label: 'Semua' },
];

export default function DashboardAdminPage() {
  const [tab, setTab] = useState<TabStatus>('menunggu');
  const [baris, setBaris] = useState<Baris[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [memproses, setMemproses] = useState<string | null>(null);

  async function muat(statusTab: TabStatus) {
    setMemuat(true);
    const res = await fetch(`/api/admin/presensi?status=${statusTab}`);
    const data = await res.json();
    setBaris(data.data ?? []);
    setMemuat(false);
  }

  useEffect(() => {
    muat(tab);
  }, [tab]);

  async function validasi(id: string, status: 'valid' | 'ditolak') {
    setMemproses(id);
    await fetch('/api/admin/presensi', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });

    if (tab === 'semua') {
      // Tetap tampil di daftar, cuma badge status-nya diperbarui.
      setBaris((b) => b.map((x) => (x.id === id ? { ...x, status_validasi: status } : x)));
    } else {
      // Di tab menunggu/valid/ditolak, baris yang berubah status keluar dari filter itu.
      setBaris((b) => b.filter((x) => x.id !== id));
    }
    setMemproses(null);
  }

  return (
    <div>
      <h1 className="text-lg font-semibold">Validasi Presensi</h1>
      <p className="text-sm text-white/50">
        Semua presensi guru — datang maupun pulang — muncul di sini lengkap dengan fotonya.
      </p>

      {/* Tab status */}
      <div className="mt-4 flex gap-1 rounded-2xl bg-white/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'flex-1 rounded-xl py-2 text-xs font-medium transition-colors ' +
              (tab === t.key ? 'bg-purple-600 text-white' : 'text-white/60')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {memuat && <p className="text-sm text-white/40">Memuat…</p>}
        {!memuat && baris.length === 0 && (
          <p className="text-sm text-white/40">Tidak ada data presensi untuk tab ini.</p>
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

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{b.nama_guru}</p>
              <BadgeStatus status={b.status_validasi} />
            </div>
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
                className={
                  'flex-1 rounded-xl border py-2 text-sm font-medium disabled:opacity-40 ' +
                  (b.status_validasi === 'ditolak'
                    ? 'border-red-400/60 bg-red-500/10 text-red-300'
                    : 'border-red-400/30 text-red-300')
                }
              >
                Tolak
              </button>
              <button
                onClick={() => validasi(b.id, 'valid')}
                disabled={memproses === b.id}
                className={
                  'flex-1 rounded-xl py-2 text-sm font-semibold disabled:opacity-40 ' +
                  (b.status_validasi === 'valid' ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-emerald-600')
                }
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

function BadgeStatus({ status }: { status: Baris['status_validasi'] }) {
  const gaya =
    status === 'valid'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'ditolak'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-amber-500/15 text-amber-300';
  const teks = status === 'valid' ? 'Valid' : status === 'ditolak' ? 'Ditolak' : 'Menunggu';
  return <span className={'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ' + gaya}>{teks}</span>;
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}