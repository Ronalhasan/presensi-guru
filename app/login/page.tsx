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
  const [memproses, setMemproses] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex min-h-screen items-center justify-center bg-[#120e19] px-5 text-white">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-lg font-semibold">Masuk</h1>
        <p className="mt-1 text-sm text-white/50">Presensi Guru — Yayasan Al Husna Popayato</p>

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs text-white/60">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-purple-400"
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
              className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-purple-400"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        <button
          type="submit"
          disabled={memproses}
          className="mt-6 w-full rounded-2xl bg-purple-600 py-3 text-sm font-semibold disabled:opacity-40"
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
