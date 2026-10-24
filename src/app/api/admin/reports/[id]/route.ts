import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { reportStatusUpdate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * PATCH /api/admin/reports/[id] — resolve/dismiss laporan.
 * Bila status resolved dan hide_target=true, konten terlapor ikut disembunyikan.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("staff");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:report:update:${user.id}`, 60, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, reportStatusUpdate);
  if ("response" in body) return body.response;
  const { status, hide_target } = body.data;

  try {
    const supabase = await createClient();

    // Ambil laporan untuk tahu target (topic/comment).
    const { data: report } = await supabase
      .from("content_reports")
      .select("id, topic_id, comment_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!report) return jsonError("Laporan tidak ditemukan.", 404);
    const r = report as { topic_id: string | null; comment_id: string | null };

    // Sembunyikan konten terlapor bila diminta (resolved + hide_target).
    if (status === "resolved" && hide_target) {
      if (r.topic_id) {
        await supabase.from("forum_topics").update({ hidden: true }).eq("id", r.topic_id);
      }
      if (r.comment_id) {
        await supabase.from("forum_comments").update({ hidden: true }).eq("id", r.comment_id);
      }
    }

    const { data, error } = await supabase
      .from("content_reports")
      .update({ status, handled_by: user.id, handled_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) return jsonError(`Gagal memperbarui laporan: ${error.message}`, 400);
    if (!data) return jsonError("Laporan tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: `content_report.${status}`,
      entityType: "content_reports",
      entityId: id,
      metadata: {
        hid_content: status === "resolved" && hide_target,
        topic_id: r.topic_id,
        comment_id: r.comment_id,
      },
    });

    return jsonOk({ item: data });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
