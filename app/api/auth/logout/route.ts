import { NextResponse } from 'next/server';
import { NAMA_COOKIE } from '@/lib/session-server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NAMA_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}
