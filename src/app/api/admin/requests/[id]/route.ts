import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { requestStatusUpdate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * PATCH /api/admin/requests/[id] — ubah status permintaan.
 * Menautkan file hasil (bila completed) agar tautan “lihat hasil” aktif.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:request:update:${user.id}`, 60, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, requestStatusUpdate);
  if ("response" in body) return body.response;
  const patch = body.data;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("content_requests")
      .update({
        status: patch.status,
        admin_notes: patch.admin_notes ?? null,
        result_file_id: patch.result_file_id ?? null,
      })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) return jsonError(`Gagal memperbarui: ${error.message}`, 400);
    if (!data) return jsonError("Permintaan tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: "content_request.status",
      entityType: "content_requests",
      entityId: id,
      metadata: { status: patch.status },
    });

    return jsonOk({ item: data });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
