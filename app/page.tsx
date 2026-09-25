import { redirect } from 'next/navigation';
import { ambilSesiDariCookie } from '@/lib/session-server';

export default async function RootPage() {
  const sesi = await ambilSesiDariCookie();
  if (!sesi) redirect('/login');
  redirect(sesi.role === 'admin' ? '/admin/dashboard' : '/beranda');
}
