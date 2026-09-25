'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/beranda', label: 'Beranda', icon: HomeIcon },
  { href: '/absen', label: 'Absen', icon: CameraIcon },
  { href: '/riwayat', label: 'Riwayat', icon: HistoryIcon },
  { href: '/teman', label: 'Teman', icon: UsersIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#1a1523]/95 backdrop-blur pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
            >
              <Icon active={!!active} />
              <span className={active ? 'font-medium text-purple-300' : 'text-white/50'}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function IconShell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      className={
        'flex h-8 w-8 items-center justify-center rounded-xl transition-colors ' +
        (active ? 'bg-purple-500/20 text-purple-300' : 'text-white/50')
      }
    >
      {children}
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <IconShell active={active}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconShell>
  );
}

function CameraIcon({ active }: { active: boolean }) {
  return (
    <IconShell active={active}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
        <circle cx="12" cy="14" r="3.2" />
      </svg>
    </IconShell>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <IconShell active={active}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
        <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 8v4.5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconShell>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <IconShell active={active}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
        <path d="M16 4.5a3 3 0 0 1 0 5.8" strokeLinecap="round" />
        <path d="M15 14c2.8.3 5 2.8 5 6" strokeLinecap="round" />
      </svg>
    </IconShell>
  );
}
