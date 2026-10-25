import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

/**
 * Klien Supabase PUBLIK tanpa sesi (role `anon`) untuk halaman publik yang
 * di-cache static/ISR. Tidak membaca `cookies()` sehingga tidak memaksa
 * rendering dynamic per-request; konten tetap difilter RLS (hanya published).
 *
 * PENTING: jangan dipakai di route yang butuh konteks user/staff (pakai
 * `createClient()` di bawah untuk itu).
 */
export function createPublicClient(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();
  return createSupabaseClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Klien Supabase berbasis sesi user di Server Components & route handler.
 * RLS berlaku sesuai user yang sedang login.
 */
export async function createClient(): Promise<SupabaseClient> {
  const { url, anonKey } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Dipanggil dari Server Component — perubahan cookie diterapkan
          // oleh proxy.ts.
        }
      },
    },
  });
}
