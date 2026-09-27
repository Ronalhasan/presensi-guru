'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <FormLogin />
    </Suspense>
  );
}

function FormLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lanjut = searchParams.get('lanjut');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordFokus, setPasswordFokus] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMemproses(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal masuk.');
        return;
      }
      const tujuan = lanjut ?? (data.role === 'admin' ? '/admin/dashboard' : '/beranda');
      router.push(tujuan);
      router.refresh();
    } catch {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setMemproses(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#120e19] px-5 py-10 text-white">
      {/* Logo & nama yayasan, di LUAR kartu login */}
      <div className="mb-6 flex flex-col items-center text-center">
        {!logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/logo.png"
            alt="Logo Yayasan"
            onError={() => setLogoError(true)}
            className="h-16 w-16 object-contain"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-lg font-bold shadow-lg shadow-purple-900/40">
            YBU
          </div>
        )}
        <p className="mt-3 text-sm font-semibold tracking-wide text-white/90">
          Yayasan Bahrul Ulum Ayatul Husna
        </p>
      </div>

      {/* Kartu login efek kaca */}
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <KucingMaskot menutupMata={passwordFokus} />

        <h1 className="mt-4 text-center text-lg font-semibold">Selamat Datang</h1>
        <p className="mt-1 text-center text-xs leading-relaxed text-purple-200/80">
          <span className="font-semibold tracking-wide">HUYULA</span>
          <br />
          Hadir Untuk Yayasan, Utamakan Loyalitas dan Amanah
        </p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-white/60">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition-colors placeholder:text-white/30 focus:border-purple-300/70 focus:bg-white/15"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Kata sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFokus(true)}
              onBlur={() => setPasswordFokus(false)}
              className="mt-1 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-md transition-colors placeholder:text-white/30 focus:border-purple-300/70 focus:bg-white/15"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/15 px-3 py-2 text-sm text-red-300 backdrop-blur-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={memproses}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 py-3 text-sm font-semibold shadow-lg shadow-purple-900/40 transition-opacity disabled:opacity-40"
        >
          {memproses ? 'Memproses…' : 'Masuk'}
        </button>

        <p className="mt-4 text-center text-xs text-white/40">
          Guru dan admin memakai halaman masuk yang sama — sistem mengenali peran dari akunnya.
        </p>
      </form>
    </div>
  );
}

/** Maskot kucing SVG: berkedip otomatis, menutup mata penuh saat kolom kata sandi difokus. */
function KucingMaskot({ menutupMata }: { menutupMata: boolean }) {
  return (
    <div className="mx-auto flex justify-center">
      <svg width="120" height="100" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Telinga */}
        <path d="M55 55 L35 15 L85 45 Z" fill="#a855f7" />
        <path d="M145 55 L165 15 L115 45 Z" fill="#a855f7" />
        <path d="M60 50 L48 25 L78 42 Z" fill="#e9d5ff" />
        <path d="M140 50 L152 25 L122 42 Z" fill="#e9d5ff" />

        {/* Kepala */}
        <ellipse cx="100" cy="90" rx="68" ry="58" fill="url(#gradKucing)" />

        {/* Pipi semu */}
        <ellipse cx="55" cy="105" rx="12" ry="7" fill="#f0abfc" opacity="0.5" />
        <ellipse cx="145" cy="105" rx="12" ry="7" fill="#f0abfc" opacity="0.5" />

        {/* Mata kiri */}
        <g className={`mata-kucing${menutupMata ? ' mata-tertutup' : ''}`}>
          <ellipse cx="72" cy="85" rx="14" ry="16" fill="white" />
          <circle cx="72" cy="87" r="7" fill="#3b0764" />
          <circle cx="75" cy="83" r="2.2" fill="white" />
        </g>

        {/* Mata kanan */}
        <g className={`mata-kucing${menutupMata ? ' mata-tertutup' : ''}`}>
          <ellipse cx="128" cy="85" rx="14" ry="16" fill="white" />
          <circle cx="128" cy="87" r="7" fill="#3b0764" />
          <circle cx="131" cy="83" r="2.2" fill="white" />
        </g>

        {/* Garis kelopak mata saat tertutup */}
        {menutupMata && (
          <>
            <path d="M58 85 Q72 92 86 85" stroke="#3b0764" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M114 85 Q128 92 142 85" stroke="#3b0764" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Hidung & mulut */}
        <path d="M96 108 L104 108 L100 114 Z" fill="#f472b6" />
        <path d="M100 114 Q100 120 90 121" stroke="#3b0764" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M100 114 Q100 120 110 121" stroke="#3b0764" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Kumis */}
        <path d="M40 100 L20 96" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 108 L18 108" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M160 100 L180 96" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M160 108 L182 108" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />

        <defs>
          <linearGradient id="gradKucing" x1="32" y1="32" x2="168" y2="148" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c084fc" />
            <stop offset="1" stopColor="#a21caf" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}