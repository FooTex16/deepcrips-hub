import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { versionCreate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/admin/versions?file_id= — daftar versi (admin konten).
 * POST /api/admin/versions — buat versi; bila is_latest, versi lain otomatis
 * diturunkan (unique partial index butuh satu latest per file).
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const fileId = url.searchParams.get("file_id");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("file_versions")
      .select("*")
      .order("released_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (fileId) query = query.eq("file_id", fileId);
    const { data, error } = await query;
    if (error) return jsonError(`Gagal memuat versi: ${error.message}`, 500);
    return jsonOk({ items: data ?? [] });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:version:create:${user.id}`, 30, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, versionCreate);
  if ("response" in body) return body.response;
  const input = body.data;

  try {
    const supabase = await createClient();

    // Bila menandai latest, turunkan latest lain pada file yang sama dulu.
    if (input.is_latest) {
      await supabase
        .from("file_versions")
        .update({ is_latest: false })
        .eq("file_id", input.file_id)
        .eq("is_latest", true);
    }

    const { data, error } = await supabase
      .from("file_versions")
      .insert({ ...input, created_by: user.id })
      .select("*")
      .single();

    if (error) return jsonError(`Gagal menyimpan versi: ${error.message}`, 400);

    await writeAuditLog({
      actorId: user.id,
      action: "file_version.create",
      entityType: "file_versions",
      entityId: (data as { id: string }).id,
      metadata: { file_id: input.file_id, version_label: input.version_label },
    });

    return jsonOk({ item: data }, { status: 201 });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
