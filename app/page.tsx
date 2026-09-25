import { redirect } from 'next/navigation';

export default function RootPage() {
  // Sementara langsung ke /beranda. Setelah halaman login dibuat,
  // ini diganti jadi: cek sesi -> redirect ke /login atau /beranda.
  redirect('/beranda');
}
