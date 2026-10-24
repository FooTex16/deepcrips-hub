import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { hostUpdate, assertHostUrl } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/** PATCH /api/admin/hosts/[id] — perbarui host (URL divalidasi ulang). */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:host:update:${user.id}`, 60, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, hostUpdate);
  if ("response" in body) return body.response;
  const patch = { ...body.data };
  if (Object.keys(patch).length === 0) return jsonError("Tidak ada perubahan.", 422);

  // Bila URL berubah, validasi ulang.
  if (patch.url !== undefined) {
    patch.url = assertHostUrl(patch.url);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("download_hosts")
      .update(patch)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) return jsonError(`Gagal memperbarui host: ${error.message}`, 400);
    if (!data) return jsonError("Host tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: "download_host.update",
      entityType: "download_hosts",
      entityId: id,
      metadata: {
        fields: Object.keys(patch),
        url_changed: patch.url !== undefined,
      },
    });

    return jsonOk({ item: data });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}

/** DELETE /api/admin/hosts/[id] — hapus host. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("download_hosts")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) return jsonError(`Gagal menghapus host: ${error.message}`, 400);
    if (!data) return jsonError("Host tidak ditemukan.", 404);

    await writeAuditLog({
      actorId: user.id,
      action: "download_host.delete",
      entityType: "download_hosts",
      entityId: id,
    });

    return jsonOk({ deleted: true });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
