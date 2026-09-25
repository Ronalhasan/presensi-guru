// app/api/auth/login/route.ts
// Login gabungan guru & admin. Username dicek dulu ke tabel admins,
// baru ke tabel guru, karena keduanya berdiri sendiri (bukan Supabase Auth).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { buatTokenSesi, NAMA_COOKIE, MASA_BERLAKU_DETIK } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan kata sandi wajib diisi.' }, { status: 400 });
  }

  // Pesan error disamakan untuk admin & guru yang tidak cocok, supaya
  // orang luar tidak bisa menebak apakah suatu username itu admin atau guru.
  const pesanSalah = 'Username atau kata sandi salah.';

  const { data: admin } = await supabase
    .from('admins')
    .select('id, username, password_hash, nama, aktif')
    .eq('username', username)
    .maybeSingle();

  if (admin) {
    if (!admin.aktif) {
      return NextResponse.json({ error: pesanSalah }, { status: 401 });
    }
    const cocok = await bcrypt.compare(password, admin.password_hash);
    if (!cocok) return NextResponse.json({ error: pesanSalah }, { status: 401 });

    const token = await buatTokenSesi({ sub: admin.id, role: 'admin', nama: admin.nama });
    const res = NextResponse.json({ ok: true, role: 'admin' as const });
    tetapkanCookie(res, token);
    return res;
  }

  const { data: guru } = await supabase
    .from('guru')
    .select('id, username, password_hash, nama_lengkap, aktif')
    .eq('username', username)
    .maybeSingle();

  if (guru) {
    if (!guru.aktif) {
      return NextResponse.json({ error: pesanSalah }, { status: 401 });
    }
    const cocok = await bcrypt.compare(password, guru.password_hash);
    if (!cocok) return NextResponse.json({ error: pesanSalah }, { status: 401 });

    const token = await buatTokenSesi({ sub: guru.id, role: 'guru', nama: guru.nama_lengkap });
    const res = NextResponse.json({ ok: true, role: 'guru' as const });
    tetapkanCookie(res, token);
    return res;
  }

  return NextResponse.json({ error: pesanSalah }, { status: 401 });
}

function tetapkanCookie(res: NextResponse, token: string) {
  res.cookies.set(NAMA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MASA_BERLAKU_DETIK,
  });
}
