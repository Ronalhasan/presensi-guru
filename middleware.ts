import { NextRequest, NextResponse } from 'next/server';
import { verifikasiToken } from '@/lib/session-server';

const AWALAN_GURU = ['/beranda', '/absen', '/riwayat', '/teman'];
const AWALAN_ADMIN = ['/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('sesi')?.value;
  const sesi = token ? await verifikasiToken(token) : null;

  const butuhGuru = AWALAN_GURU.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const butuhAdmin = AWALAN_ADMIN.some((p) => pathname === p || pathname.startsWith(p + '/'));

  // Halaman guru/admin diakses tanpa sesi valid -> lempar ke /login
  if ((butuhGuru || butuhAdmin) && !sesi) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('lanjut', pathname);
    return NextResponse.redirect(url);
  }

  // Guru tidak boleh masuk area admin, dan sebaliknya
  if (butuhGuru && sesi && sesi.role !== 'guru') {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }
  if (butuhAdmin && sesi && sesi.role !== 'admin') {
    return NextResponse.redirect(new URL('/beranda', req.url));
  }

  // Sudah login tapi buka /login lagi -> lempar ke beranda masing-masing
  if (pathname === '/login' && sesi) {
    return NextResponse.redirect(new URL(sesi.role === 'admin' ? '/admin/dashboard' : '/beranda', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/beranda/:path*',
    '/absen/:path*',
    '/riwayat/:path*',
    '/teman/:path*',
    '/admin/:path*',
    '/login',
  ],
};
