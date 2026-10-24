import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "./env";

/**
 * Klien Supabase untuk komponen client-side (auth state, aksi ringan).
 * Hanya memakai ANON key — tidak pernah service-role.
 */
export function createClient(): SupabaseClient {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
