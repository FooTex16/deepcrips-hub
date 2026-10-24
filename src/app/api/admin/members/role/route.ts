import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { memberRoleUpdate } from "@/lib/admin-schemas";
import { writeAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

/**
 * PATCH /api/admin/members — beri/cabut peran (hanya primary_admin).
 * Menolak pencabutan peran primary_admin terakhir agar tidak terkunci keluar.
 */
export async function PATCH(request: Request) {
  const guard = await requireAdmin("primary_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimit(`admin:role:${user.id}`, 30, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(request, memberRoleUpdate);
  if ("response" in body) return body.response;
  const { user_id, role, action } = body.data;

  if (user_id === user.id && action === "revoke" && role === "primary_admin") {
    // Hitung primary_admin lain.
    try {
      const supabase = await createClient();
      const { count } = await supabase
        .from("member_roles")
        .select("user_id", { count: "exact", head: true })
        .eq("role", "primary_admin");
      if ((count ?? 0) <= 1) {
        return jsonError(
          "Tidak dapat mencabut peran admin utama terakhir — situs akan kehilangan semua admin utama.",
          422
        );
      }
    } catch {
      return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
    }
  }

  try {
    const supabase = await createClient();
    if (action === "grant") {
      const { error } = await supabase
        .from("member_roles")
        .insert({ user_id, role, granted_by: user.id });
      if (error && error.code !== "23505") {
        return jsonError(`Gagal memberi peran: ${error.message}`, 400);
      }
    } else {
      const { error } = await supabase
        .from("member_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", role);
      if (error) return jsonError(`Gagal mencabut peran: ${error.message}`, 400);
    }

    await writeAuditLog({
      actorId: user.id,
      action: `member_role.${action}`,
      entityType: "member_roles",
      entityId: user_id,
      metadata: { role },
    });

    return jsonOk({ user_id, role, action });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
