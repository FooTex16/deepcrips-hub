import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Menulis audit log TINDAKAN SENSITIF (penerbitan konten, perubahan host,
 * perubahan peran, moderasi, settings).
 *
 * - Hanya dipanggil dari route handler server.
 * - Memakai service-role; client tidak memiliki policy INSERT (lihat RLS).
 * - metadata tidak boleh memuat secret (divalidasi pemanggil).
 */
export async function writeAuditLog(params: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: params.actorId,
      action: params.action.slice(0, 80),
      entity_type: params.entityType.slice(0, 40),
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
    });
    if (error) {
      // Jangan crash request hanya karena log gagal — tapi jangan diam.
      console.error("[audit] gagal menulis log:", error.message);
    }
  } catch (err) {
    console.error(
      "[audit] service role belum dikonfigurasi — log tindakan TIDAK tercatat:",
      err instanceof Error ? err.message : err
    );
  }
}
