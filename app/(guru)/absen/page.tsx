'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Jenis = 'datang' | 'pulang';
type Kategori = 'reguler' | 'penugasan';

export default function AbsenPage() {
  return (
    <Suspense fallback={<div className="px-5 pt-6 text-sm text-white/50">Memuat…</div>}>
      <AbsenIsi />
    </Suspense>
  );
}

function AbsenIsi() {
  const searchParams = useSearchParams();
  const kategori: Kategori = searchParams.get('kategori') === 'penugasan' ? 'penugasan' : 'reguler';
  const guruIdTarget = searchParams.get('guru_id_target');
  const namaTarget = searchParams.get('nama');
  const jenisAwal = searchParams.get('jenis') === 'pulang' ? 'pulang' : 'datang';

  const [jenis, setJenis] = useState<Jenis>(jenisAwal as Jenis);
  const [kameraSiap, setKameraSiap] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: 'ok' | 'error'; teks: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const nyalakanKamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setKameraSiap(true);
    } catch {
      setPesan({ tipe: 'error', teks: 'Tidak bisa mengakses kamera. Izinkan akses kamera di browser.' });
    }
  }, []);

  useEffect(() => {
    nyalakanKamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [nyalakanKamera]);

  function ambilFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFoto(canvas.toDataURL('image/jpeg', 0.85));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function ulangiFoto() {
    setFoto(null);
    setPesan(null);
    nyalakanKamera();
  }

  async function kirim() {
    if (!foto) return;
    setMengirim(true);
    setPesan(null);
    try {
      const blob = await (await fetch(foto)).blob();
      const form = new FormData();
      form.append('jenis', jenis);
      form.append('kategori', kategori);
      if (guruIdTarget) form.append('guru_id_target', guruIdTarget);
      form.append('foto', blob, 'presensi.jpg');

      const res = await fetch('/api/presensi', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setPesan({ tipe: 'error', teks: data.error ?? 'Gagal mengirim presensi.' });
      } else {
        setPesan({ tipe: 'ok', teks: data.pesan ?? 'Presensi terkirim.' });
      }
    } catch {
      setPesan({ tipe: 'error', teks: 'Koneksi bermasalah. Coba lagi.' });
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div className="px-5 pt-6">
      <h1 className="text-lg font-semibold">
        Absen {kategori === 'penugasan' ? 'Penugasan' : 'Reguler'}
      </h1>
      <p className="text-sm text-white/50">Foto wajah dicocokkan admin, jam memakai jam server.</p>
      {guruIdTarget && namaTarget && (
        <div className="mt-3 rounded-xl bg-purple-500/15 px-3 py-2 text-sm text-purple-200">
          Mengabsenkan: <span className="font-medium">{namaTarget}</span>
        </div>
      )}

      {/* Pilih jenis */}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
        {(['datang', 'pulang'] as Jenis[]).map((j) => (
          <button
            key={j}
            onClick={() => setJenis(j)}
            className={
              'rounded-xl py-2 text-sm font-medium capitalize transition-colors ' +
              (jenis === j ? 'bg-purple-600 text-white' : 'text-white/60')
            }
          >
            {j}
          </button>
        ))}
      </div>

      {/* Kamera / preview */}
      <div className="mt-4 aspect-[3/4] overflow-hidden rounded-3xl bg-black/40">
        {!foto ? (
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Pratinjau presensi" className="h-full w-full object-cover" />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      {pesan && (
        <div
          className={
            'mt-3 rounded-xl px-3 py-2 text-sm ' +
            (pesan.tipe === 'ok' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300')
          }
        >
          {pesan.teks}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        {!foto ? (
          <button
            onClick={ambilFoto}
            disabled={!kameraSiap}
            className="flex-1 rounded-2xl bg-purple-600 py-3 text-sm font-semibold disabled:opacity-40"
          >
            Ambil Foto
          </button>
        ) : (
          <>
            <button
              onClick={ulangiFoto}
              disabled={mengirim}
              className="flex-1 rounded-2xl border border-white/15 py-3 text-sm font-medium disabled:opacity-40"
            >
              Ulangi
            </button>
            <button
              onClick={kirim}
              disabled={mengirim}
              className="flex-1 rounded-2xl bg-purple-600 py-3 text-sm font-semibold disabled:opacity-40"
            >
              {mengirim ? 'Mengirim…' : 'Kirim Presensi'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
