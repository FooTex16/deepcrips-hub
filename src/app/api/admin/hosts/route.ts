import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { hostCreate, assertHostUrl } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * GET /api/admin/hosts?version_id= — daftar host unduhan (admin konten).
 * URL asli hanya terlihat oleh admin (RLS).
 * POST /api/admin/hosts — tambah host; URL divalidasi anti-SSRF.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const versionId = url.searchParams.get("version_id");

  try {
    const supabase = await createClient();
    let query = supabase
      .from("download_hosts")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (versionId) query = query.eq("file_version_id", versionId);
    const { data, error } = await query;
    if (error) return jsonError(`Gagal memuat host: ${error.message}`, 500);
    return jsonOk({ items: data ?? [] });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:host:create:${user.id}`, 30, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, hostCreate);
  if ("response" in body) return body.response;
  const input = body.data;

  // Validasi URL host (anti-SSRF) — normalized yang disimpan.
  const normalized = assertHostUrl(input.url);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("download_hosts")
      .insert({ ...input, url: normalized, created_by: user.id })
      .select("*")
      .single();

    if (error) return jsonError(`Gagal menyimpan host: ${error.message}`, 400);

    await writeAuditLog({
      actorId: user.id,
      action: "download_host.create",
      entityType: "download_hosts",
      entityId: (data as { id: string }).id,
      metadata: { name: input.name, host: new URL(normalized).hostname },
    });

    return jsonOk({ item: data }, { status: 201 });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
