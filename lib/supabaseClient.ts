// lib/supabaseClient.ts
// Klien Supabase untuk dipakai di komponen sisi client (browser).
'use client';

import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type GuruSesi = {
  id: string;
  nama_lengkap: string;
  username: string;
  foto_profil_url: string | null;
  nip_nuptk: string | null;
};
