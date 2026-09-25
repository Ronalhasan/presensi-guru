'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser, GuruSesi } from '@/lib/supabaseClient';

type StatusHariIni = {
  datang: { jam: string; status: 'menunggu' | 'valid' | 'ditolak' } | null;
  pulang: { jam: string; status: 'menunggu' | 'valid' | 'ditolak' } | null;
};

const MENU = [
  { href: '/absen', label: 'Absen', icon: '📷', hint: 'Datang / pulang' },
  { href: '/riwayat', label: 'Riwayat', icon: '🗂️', hint: 'Rekap presensi' },
  { href: '/teman', label: 'Presensikan Teman', icon: '🤝', hint: 'Bantu absenkan' },
  { href: '/absen?kategori=penugasan', label: 'Penugasan', icon: '🧭', hint: 'Absen tugas luar' },
];

export default function BerandaPage() {
  const [guru, setGuru] = useState<GuruSesi | null>(null);
  const [status, setStatus] = useState<StatusHariIni>({ datang: null, pulang: null });
  const [memuat, setMemuat] = useState(true);

  useEffect(() => {
    async function muat() {
      const { data: sesi } = await supabaseBrowser.auth.getSession();
      const userId = sesi.session?.user.id;
      if (!userId) {
        setMemuat(false);
        return;
      }

      const { data: profilGuru } = await supabaseBrowser
        .from('guru')
        .select('id, nama_lengkap, username, foto_profil_url, nip_nuptk')
        .eq('id', userId)
        .single();
      setGuru(profilGuru);

      const hariIni = new Date().toISOString().slice(0, 10);
      const { data: presensiHariIni } = await supabaseBrowser
        .from('presensi')
        .select('jenis, jam_tercatat, status_validasi')
        .eq('guru_id', userId)
        .eq('tanggal', hariIni)
        .eq('kategori', 'reguler');

      const datang = presensiHariIni?.find((p) => p.jenis === 'datang');
      const pulang = presensiHariIni?.find((p) => p.jenis === 'pulang');
      setStatus({
        datang: datang
          ? { jam: formatJam(datang.jam_tercatat), status: datang.status_validasi }
          : null,
        pulang: pulang
          ? { jam: formatJam(pulang.jam_tercatat), status: pulang.status_validasi }
          : null,
      });
      setMemuat(false);
    }
    muat();
  }, []);

  return (
    <div className="px-5 pt-6">
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
          <StatusPill label="Datang" data={status.datang} />
          <StatusPill label="Pulang" data={status.pulang} />
        </div>
      </div>

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

function StatusPill({ label, data }: { label: string; data: StatusHariIni['datang'] }) {
  const teks = !data
    ? 'Belum absen'
    : data.status === 'menunggu'
      ? `${data.jam} · Menunggu`
      : data.status === 'valid'
        ? `${data.jam} · Valid`
        : `${data.jam} · Ditolak`;

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
