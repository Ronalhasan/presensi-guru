'use client';

import { useEffect, useState } from 'react';

type Guru = {
  id: string;
  username: string;
  nama_lengkap: string;
  nip_nuptk: string | null;
  aktif: boolean;
  created_at: string;
};

export default function KelolaGuruPage() {
  const [daftar, setDaftar] = useState<Guru[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [formTerbuka, setFormTerbuka] = useState(false);

  async function muat() {
    setMemuat(true);
    const res = await fetch('/api/admin/guru');
    const data = await res.json();
    setDaftar(data.data ?? []);
    setMemuat(false);
  }

  useEffect(() => {
    muat();
  }, []);

  async function ubahStatus(id: string, aktif: boolean) {
    setDaftar((d) => d.map((g) => (g.id === id ? { ...g, aktif } : g)));
    await fetch('/api/admin/guru', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, aktif }),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Kelola Akun Guru</h1>
          <p className="text-sm text-white/50">{daftar.length} akun terdaftar.</p>
        </div>
        <button
          onClick={() => setFormTerbuka((v) => !v)}
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold"
        >
          {formTerbuka ? 'Tutup' : '+ Tambah Guru'}
        </button>
      </div>

      {formTerbuka && (
        <FormTambahGuru
          onBerhasil={() => {
            setFormTerbuka(false);
            muat();
          }}
        />
      )}

      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">NIP/NUPTK</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {memuat && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-white/40">
                  Memuat…
                </td>
              </tr>
            )}
            {!memuat && daftar.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-white/40">
                  Belum ada akun guru.
                </td>
              </tr>
            )}
            {daftar.map((g) => (
              <tr key={g.id}>
                <td className="px-4 py-3 font-medium">{g.nama_lengkap}</td>
                <td className="px-4 py-3 text-white/60">{g.username}</td>
                <td className="px-4 py-3 text-white/60">{g.nip_nuptk ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      'rounded-full px-3 py-1 text-xs font-medium ' +
                      (g.aktif ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-white/50')
                    }
                  >
                    {g.aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => ubahStatus(g.id, !g.aktif)}
                    className="text-xs font-medium text-purple-300 hover:text-purple-200"
                  >
                    {g.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormTambahGuru({ onBerhasil }: { onBerhasil: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nipNuptk, setNipNuptk] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMengirim(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          nama_lengkap: namaLengkap,
          nip_nuptk: nipNuptk || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menambah guru.');
        return;
      }
      onBerhasil();
    } catch {
      setError('Koneksi bermasalah. Coba lagi.');
    } finally {
      setMengirim(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
      <Input label="Nama lengkap" value={namaLengkap} onChange={setNamaLengkap} required />
      <Input label="NIP / NUPTK (opsional)" value={nipNuptk} onChange={setNipNuptk} />
      <Input label="Username" value={username} onChange={setUsername} required />
      <Input label="Kata sandi awal" type="password" value={password} onChange={setPassword} required />

      {error && (
        <div className="sm:col-span-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={mengirim}
          className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
        >
          {mengirim ? 'Menyimpan…' : 'Simpan Akun Guru'}
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs text-white/60">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-purple-400"
      />
    </label>
  );
}
