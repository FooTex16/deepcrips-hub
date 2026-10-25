import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";

/**
 * GET /api/admin/moderation/topics — daftar topik (termasuk tersembunyi,
 * yang tidak terlihat publik). Untuk moderasi admin.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("staff");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().replace(/[%_,()\\]/g, "");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));

  try {
    const supabase = await createClient();
    let query = supabase
      .from("forum_topics")
      .select("id, title, body, hidden, locked, comment_count, hotness_score, created_at, author:profiles!author_id(id, display_name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error } = await query;
    if (error) return jsonError(`Gagal memuat topik: ${error.message}`, 500);
    return jsonOk({ items: data ?? [] });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
