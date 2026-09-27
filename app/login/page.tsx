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
  const [tampilkanSandi, setTampilkanSandi] = useState(false);
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
      {/* Kartu login efek kaca */}
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        {/* Logo yayasan */}
        <div className="flex justify-center">
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo.png"
              alt="Logo Yayasan Bahrul Ulum Ayatul Husna"
              onError={() => setLogoError(true)}
              className="h-20 w-20 object-contain"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-lg font-bold shadow-lg shadow-purple-900/40">
              YBU
            </div>
          )}
        </div>

        <h1 className="mt-4 text-center text-lg font-semibold leading-snug">
          Selamat Datang di Yayasan Bahrul Ulum Ayatul Husna
        </h1>
        <p className="mt-2 text-center text-xs leading-relaxed text-purple-200/80">
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
            <div className="relative mt-1">
              <input
                type={tampilkanSandi ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-11 text-sm text-white outline-none backdrop-blur-md transition-colors placeholder:text-white/30 focus:border-purple-300/70 focus:bg-white/15"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setTampilkanSandi((v) => !v)}
                tabIndex={-1}
                aria-label={tampilkanSandi ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
              >
                {tampilkanSandi ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 4.22-5.06M9.9 4.24A10.4 10.4 0 0 1 12 5c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <path d="M1 1l22 22" />
                  </svg>
                )}
              </button>
            </div>
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