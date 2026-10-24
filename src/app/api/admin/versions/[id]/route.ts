import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { versionUpdate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/** PATCH /api/admin/versions/[id] — perbarui versi (kelola is_latest). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:version:update:${user.id}`, 60, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, versionUpdate);
  if ("response" in body) return body.response;
  const patch = body.data;
  if (Object.keys(patch).length === 0) return jsonError("Tidak ada perubahan.", 422);

  try {
    const supabase = await createClient();

    // Ambil file_id versi ini untuk mengelola is_latest unik.
    const { data: current } = await supabase
      .from("file_versions")
      .select("id, file_id")
      .eq("id", id)
      .maybeSingle();
    if (!current) return jsonError("Versi tidak ditemukan.", 404);

    if (patch.is_latest === true) {
      await supabase
        .from("file_versions")
        .update({ is_latest: false })
        .eq("file_id", (current as { file_id: string }).file_id)
        .eq("is_latest", true)
        .neq("id", id);
    }

    const { data, error } = await supabase
      .from("file_versions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) return jsonError(`Gagal memperbarui versi: ${error.message}`, 400);
    if (!data) return jsonError("Versi tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: "file_version.update",
      entityType: "file_versions",
      entityId: id,
      metadata: { fields: Object.keys(patch) },
    });

    return jsonOk({ item: data });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}

/** DELETE /api/admin/versions/[id] — hapus versi (beserta host terkait, cascade). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("primary_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("file_versions")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return jsonError(`Gagal menghapus versi: ${error.message}`, 400);
    if (!data) return jsonError("Versi tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: "file_version.delete",
      entityType: "file_versions",
      entityId: id,
    });

    return jsonOk({ deleted: true });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
