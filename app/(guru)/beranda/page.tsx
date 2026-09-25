'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProfilGuru = {
  id: string;
  nama_lengkap: string;
  username: string;
  foto_profil_url: string | null;
  nip_nuptk: string | null;
};

type StatusRingkas = { jam_tercatat: string; status_validasi: 'menunggu' | 'valid' | 'ditolak' } | null;

const MENU = [
  { href: '/absen', label: 'Absen', icon: '📷', hint: 'Datang / pulang' },
  { href: '/riwayat', label: 'Riwayat', icon: '🗂️', hint: 'Rekap presensi' },
  { href: '/teman', label: 'Presensikan Teman', icon: '🤝', hint: 'Bantu absenkan' },
  { href: '/absen?kategori=penugasan', label: 'Penugasan', icon: '🧭', hint: 'Absen tugas luar' },
];

export default function BerandaPage() {
  const router = useRouter();
  const [guru, setGuru] = useState<ProfilGuru | null>(null);
  const [datang, setDatang] = useState<StatusRingkas>(null);
  const [pulang, setPulang] = useState<StatusRingkas>(null);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function muat() {
      try {
        const res = await fetch('/api/beranda');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Gagal memuat data.');
          return;
        }
        setGuru(data.guru);
        setDatang(data.datang);
        setPulang(data.pulang);
      } catch {
        setError('Koneksi bermasalah. Coba muat ulang halaman.');
      } finally {
        setMemuat(false);
      }
    }
    muat();
  }, [router]);

  async function keluar() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="px-5 pt-6">
      <div className="mb-3 flex justify-end">
        <button onClick={keluar} className="text-xs text-white/40 hover:text-white/70">
          Keluar
        </button>
      </div>

      {/* Kartu profil ungu */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-800 p-5 shadow-lg shadow-purple-900/30">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-semibold">
            {guru?.foto_profil_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={guru.foto_profil_url} alt={guru.nama_lengkap} className="h-full w-full object-cover" />
            ) : (
              inisial(guru?.nama_lengkap)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">
              {memuat ? 'Memuat…' : guru?.nama_lengkap ?? 'Guru'}
            </p>
            <p className="truncate text-xs text-white/70">{guru?.nip_nuptk ?? guru?.username ?? ''}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatusPill label="Datang" data={datang} />
          <StatusPill label="Pulang" data={pulang} />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      {/* Grid menu ikon */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {MENU.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors active:bg-white/10"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-lg">
              {m.icon}
            </div>
            <p className="mt-3 text-sm font-medium">{m.label}</p>
            <p className="text-xs text-white/50">{m.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ label, data }: { label: string; data: StatusRingkas }) {
  const teks = !data
    ? 'Belum absen'
    : data.status_validasi === 'menunggu'
      ? `${formatJam(data.jam_tercatat)} · Menunggu`
      : data.status_validasi === 'valid'
        ? `${formatJam(data.jam_tercatat)} · Valid`
        : `${formatJam(data.jam_tercatat)} · Ditolak`;

  return (
    <div className="rounded-xl bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{teks}</p>
    </div>
  );
}

function inisial(nama?: string | null) {
  if (!nama) return 'G';
  return nama
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
