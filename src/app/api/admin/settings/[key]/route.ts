import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { settingUpdate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * PUT /api/admin/settings — upsert satu pengaturan (hanya primary_admin).
 * Nilai jsonb non-secret (tautan komunitas, teks footer, dsb).
 */
export async function PUT(request: Request) {
  const guard = await requireAdmin("primary_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:settings:${user.id}`, 30, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, settingUpdate);
  if ("response" in body) return body.response;
  const { key, value, description } = body.data;

  // Cegah penyimpanan rahasia di site_settings.
  const serialized = JSON.stringify(value).toLowerCase();
  const suspicious = ["service_role", "secret", "password", "api_key", "private_key", "token"];
  if (suspicious.some((s) => serialized.includes(s) || key.toLowerCase().includes(s))) {
    return jsonError(
      "site_settings tidak boleh menyimpan rahasia. Gunakan environment variable server.",
      422
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .upsert({ key, value, description: description ?? null, updated_by: user.id })
      .select("*")
      .single();

    if (error) return jsonError(`Gagal menyimpan pengaturan: ${error.message}`, 400);

    await writeAuditLog({
      actorId: user.id,
      action: "site_setting.upsert",
      entityType: "site_settings",
      entityId: key,
    });

    return jsonOk({ item: data });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
