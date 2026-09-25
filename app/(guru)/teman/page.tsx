'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

type GuruRingkas = {
  id: string;
  nama_lengkap: string;
  nip_nuptk: string | null;
  foto_profil_url: string | null;
};

export default function TemanPage() {
  const router = useRouter();
  const [kueri, setKueri] = useState('');
  const [hasil, setHasil] = useState<GuruRingkas[]>([]);
  const [mencari, setMencari] = useState(false);
  const [terpilih, setTerpilih] = useState<GuruRingkas | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!kueri.trim()) {
      setHasil([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setMencari(true);
      const { data } = await supabaseBrowser
        .from('guru')
        .select('id, nama_lengkap, nip_nuptk, foto_profil_url')
        .eq('aktif', true)
        .ilike('nama_lengkap', `%${kueri.trim()}%`)
        .order('nama_lengkap')
        .limit(15);
      setHasil(data ?? []);
      setMencari(false);
    }, 300);
  }, [kueri]);

  function lanjutkanAbsen(jenis: 'datang' | 'pulang') {
    if (!terpilih) return;
    const params = new URLSearchParams({
      guru_id_target: terpilih.id,
      nama: terpilih.nama_lengkap,
      jenis,
    });
    router.push(`/absen?${params.toString()}`);
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-lg font-semibold">Presensikan Teman</h1>
      <p className="text-sm text-white/50">
        Cari nama guru yang tidak punya HP atau data internet, lalu absenkan atas namanya. Foto tetap
        divalidasi admin, dan sistem mencatat siapa yang mengabsenkan.
      </p>

      {!terpilih ? (
        <>
          <input
            value={kueri}
            onChange={(e) => setKueri(e.target.value)}
            placeholder="Ketik nama guru…"
            className="mt-4 w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-purple-400"
          />

          <div className="mt-3 space-y-2">
            {mencari && <p className="text-sm text-white/40">Mencari…</p>}
            {!mencari && kueri.trim() && hasil.length === 0 && (
              <p className="text-sm text-white/40">Tidak ada guru dengan nama itu.</p>
            )}
            {hasil.map((g) => (
              <button
                key={g.id}
                onClick={() => setTerpilih(g)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left active:bg-white/10"
              >
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-purple-500/20 text-sm font-semibold">
                  {g.foto_profil_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.foto_profil_url} alt={g.nama_lengkap} className="h-full w-full object-cover" />
                  ) : (
                    inisial(g.nama_lengkap)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{g.nama_lengkap}</p>
                  {g.nip_nuptk && <p className="truncate text-xs text-white/50">{g.nip_nuptk}</p>}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-purple-500/20 text-base font-semibold">
              {terpilih.foto_profil_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={terpilih.foto_profil_url}
                  alt={terpilih.nama_lengkap}
                  className="h-full w-full object-cover"
                />
              ) : (
                inisial(terpilih.nama_lengkap)
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{terpilih.nama_lengkap}</p>
              <p className="text-xs text-white/50">{terpilih.nip_nuptk ?? ''}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-white/60">Pilih jenis presensi yang akan dicatat:</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => lanjutkanAbsen('datang')}
              className="flex-1 rounded-2xl bg-purple-600 py-3 text-sm font-semibold"
            >
              Datang
            </button>
            <button
              onClick={() => lanjutkanAbsen('pulang')}
              className="flex-1 rounded-2xl bg-purple-600 py-3 text-sm font-semibold"
            >
              Pulang
            </button>
          </div>
          <button
            onClick={() => setTerpilih(null)}
            className="mt-3 w-full rounded-2xl border border-white/15 py-3 text-sm font-medium text-white/70"
          >
            Ganti Guru
          </button>
        </div>
      )}
    </div>
  );
}

function inisial(nama: string) {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}
