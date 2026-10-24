import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, requireSupabaseEnv } from "./env";

/**
 * Klien service-role — HANYA untuk route handler server (mis. resolusi URL
 * host download & pencatatan klik). Melewati RLS, karena itu semua pemanggil
 * WAJIB melakukan otorisasi manual sebelum memakai hasilnya.
 *
 * Jangan mengimpor modul ini dari komponen client!
 */
export function createAdminClient() {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum diatur di environment server. Fitur ini membutuhkannya."
    );
  }
  const { url } = requireSupabaseEnv();
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
