'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type BarisPresensi = {
  id: string;
  tanggal: string;
  jenis: 'datang' | 'pulang';
  kategori: 'reguler' | 'penugasan';
  jam_tercatat: string;
  status_validasi: 'menunggu' | 'valid' | 'ditolak';
  diabsenkan_oleh_guru_id: string | null;
};

export default function RiwayatPage() {
  const router = useRouter();
  const [baris, setBaris] = useState<BarisPresensi[]>([]);
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    async function muat() {
      const res = await fetch('/api/riwayat');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setBaris(data.data ?? []);
      setMemuat(false);
    }
    muat();
  }, [router]);

  const dikelompokkan = useMemo(() => {
    const map = new Map<string, BarisPresensi[]>();
    for (const b of baris) {
      const arr = map.get(b.tanggal) ?? [];
      arr.push(b);
      map.set(b.tanggal, arr);
    }
    return Array.from(map.entries());
  }, [baris]);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-lg font-semibold">Riwayat Presensi</h1>
      <p className="text-sm text-white/50">60 catatan terakhir, terbaru di atas.</p>

      <div className="mt-4 space-y-5">
        {memuat && <p className="text-sm text-white/40">Memuat…</p>}
        {!memuat && dikelompokkan.length === 0 && (
          <p className="text-sm text-white/40">Belum ada riwayat presensi.</p>
        )}

        {dikelompokkan.map(([tanggal, item]) => (
          <div key={tanggal}>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              {formatTanggal(tanggal)}
            </p>
            <div className="space-y-2">
              {item.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {b.jenis} {b.kategori === 'penugasan' ? '· Penugasan' : ''}
                    </p>
                    <p className="text-xs text-white/50">
                      {formatJam(b.jam_tercatat)}
                      {b.diabsenkan_oleh_guru_id ? ' · diabsenkan teman' : ''}
                    </p>
                  </div>
                  <Badge status={b.status_validasi} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ status }: { status: BarisPresensi['status_validasi'] }) {
  const style =
    status === 'valid'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'ditolak'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-amber-500/15 text-amber-300';
  const label = status === 'valid' ? 'Valid' : status === 'ditolak' ? 'Ditolak' : 'Menunggu';
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${style}`}>{label}</span>;
}

function formatTanggal(tgl: string) {
  return new Date(tgl).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
