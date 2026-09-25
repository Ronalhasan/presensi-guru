// app/api/admin/guru/route.ts
// GET   -> daftar semua akun guru
// POST  { username, password, nama_lengkap, nip_nuptk? } -> buat akun guru baru
// PATCH { id, aktif } -> aktifkan/nonaktifkan akun guru

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { ambilSesiDariCookie } from '@/lib/session-server';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function pastikanAdmin() {
  const sesi = await ambilSesiDariCookie();
  if (!sesi || sesi.role !== 'admin') return null;
  return sesi;
}

export async function GET() {
  const sesi = await pastikanAdmin();
  if (!sesi) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });

  const { data, error } = await supabase
    .from('guru')
    .select('id, username, nama_lengkap, nip_nuptk, aktif, created_at')
    .order('nama_lengkap');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const sesi = await pastikanAdmin();
  if (!sesi) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });

  let body: { username?: string; password?: string; nama_lengkap?: string; nip_nuptk?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;
  const nama_lengkap = body.nama_lengkap?.trim();

  if (!username || !password || !nama_lengkap) {
    return NextResponse.json(
      { error: 'Username, kata sandi, dan nama lengkap wajib diisi.' },
      { status: 400 }
    );
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Kata sandi minimal 6 karakter.' }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('guru')
    .insert({
      username,
      password_hash,
      nama_lengkap,
      nip_nuptk: body.nip_nuptk?.trim() || null,
      dibuat_oleh_admin_id: sesi.sub,
    })
    .select('id, username, nama_lengkap, nip_nuptk, aktif, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username sudah dipakai.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, guru: data });
}

export async function PATCH(req: NextRequest) {
  const sesi = await pastikanAdmin();
  if (!sesi) return NextResponse.json({ error: 'Tidak diizinkan.' }, { status: 403 });

  let body: { id?: string; aktif?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  if (!body.id || typeof body.aktif !== 'boolean') {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const { error } = await supabase.from('guru').update({ aktif: body.aktif }).eq('id', body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
