import { createClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";

/**
 * GET /api/admin/moderation/comments — daftar komentar tersembunyi
 * (untuk ditinjau & dipulihkan oleh moderator).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("staff");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "50") || 50));

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_comments")
      .select(
        "id, body, hidden, created_at, author:profiles!author_id(id, display_name), topic:forum_topics!topic_id(id, title)"
      )
      .eq("hidden", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return jsonError(`Gagal memuat komentar: ${error.message}`, 500);
    return jsonOk({ items: data ?? [] });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
