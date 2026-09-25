// lib/session-server.ts
// Sesi login berbasis cookie httpOnly berisi JWT (bukan Supabase Auth,
// karena tabel guru & admins punya username+password sendiri).
// File ini dipakai di middleware.ts (Edge runtime) DAN di route.ts
// (Node runtime) — karena itu memakai `jose`, yang jalan di keduanya.

import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

const NAMA_COOKIE = 'sesi';
const MASA_BERLAKU_DETIK = 60 * 60 * 12; // 12 jam

function rahasia() {
  const nilai = process.env.SESSION_SECRET;
  if (!nilai) {
    throw new Error('SESSION_SECRET belum diatur di environment variable.');
  }
  return new TextEncoder().encode(nilai);
}

export type SesiPayload = {
  sub: string; // id guru atau admin
  role: 'guru' | 'admin';
  nama: string;
};

/** Membuat token JWT baru untuk disimpan di cookie. */
export async function buatTokenSesi(payload: SesiPayload): Promise<string> {
  return await new SignJWT({ role: payload.role, nama: payload.nama })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${MASA_BERLAKU_DETIK}s`)
    .sign(rahasia());
}

/** Memverifikasi token JWT. Mengembalikan null jika tidak valid/kedaluwarsa. */
export async function verifikasiToken(token: string): Promise<SesiPayload | null> {
  try {
    const { payload } = await jwtVerify(token, rahasia());
    if (!payload.sub || (payload.role !== 'guru' && payload.role !== 'admin')) return null;
    return { sub: payload.sub, role: payload.role, nama: (payload.nama as string) ?? '' };
  } catch {
    return null;
  }
}

/** Membaca sesi dari cookie request saat ini. Hanya bisa dipakai di Server Component / Route Handler. */
export async function ambilSesiDariCookie(): Promise<SesiPayload | null> {
  const token = cookies().get(NAMA_COOKIE)?.value;
  if (!token) return null;
  return verifikasiToken(token);
}

export { NAMA_COOKIE, MASA_BERLAKU_DETIK };
