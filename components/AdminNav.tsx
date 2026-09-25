'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const ITEMS = [
  { href: '/admin/dashboard', label: 'Validasi' },
  { href: '/admin/guru', label: 'Kelola Guru' },
  { href: '/admin/rekap', label: 'Rekap' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function keluar() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="border-b border-white/10 bg-[#1a1523]">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
        <div className="flex gap-4">
          {ITEMS.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={
                'text-sm font-medium ' +
                (pathname?.startsWith(it.href) ? 'text-purple-300' : 'text-white/60')
              }
            >
              {it.label}
            </Link>
          ))}
        </div>
        <button onClick={keluar} className="text-sm text-white/50 hover:text-white">
          Keluar
        </button>
      </div>
    </nav>
  );
}