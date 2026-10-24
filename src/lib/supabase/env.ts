/**
 * Validasi environment variables.
 * Jangan pernah mencetak nilai secret ke log.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Salin .env.example menjadi .env.local lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return { url, anonKey };
}

export function getServiceRoleKey(): string | null {
  // Hanya untuk kode server (route handler / lib server). JANGAN pernah
  // mengimpor modul ini di komponen client.
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}
