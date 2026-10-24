import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";

/**
 * GET /api/admin/members — daftar anggota beserta peran (admin utama).
 * Email tidak pernah dikirim ke frontend (hanya id + nama tampilan).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("primary_admin");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/[%_,()\\]/g, "");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "25") || 25));

  try {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at, roles:member_roles(role)", { count: "exact" });
    if (q) query = query.ilike("display_name", `%${q}%`);

    const from = (page - 1) * limit;
    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) return jsonError(`Gagal memuat anggota: ${error.message}`, 500);
    const total = count ?? 0;
    return jsonOk({
      items: data ?? [],
      count: total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
