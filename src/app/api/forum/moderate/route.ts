import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, jsonError, jsonOk } from "@/lib/api";
import { getStaffContext } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

/**
 * POST /api/forum/moderate — aksi moderasi topik/komentar.
 * Hanya moderator/admin (dicek server-side via member_roles + RLS).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const staff = await getStaffContext();
  if (!staff?.isStaff) {
    return jsonError("Akses ditolak — hanya moderator yang dapat melakukan tindakan ini.", 403);
  }

  const limit = rateLimit(`forum:mod:${user.id}`, 60, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan moderasi. Tunggu sebentar.", 429);

  const body = await parseBody(
    request,
    z.object({
      target_type: z.enum(["topic", "comment"]),
      target_id: z.string().uuid(),
      action: z.enum(["hide", "unhide", "lock", "unlock"]),
    })
  );
  if ("response" in body) return body.response;
  const { target_type, target_id, action } = body.data;

  const supabase = await createClient();
  const table = target_type === "topic" ? "forum_topics" : "forum_comments";

  let patch: Record<string, boolean> = {};
  if (action === "hide") patch = { hidden: true };
  else if (action === "unhide") patch = { hidden: false };
  else if (action === "lock") patch = { locked: true };
  else if (action === "unlock") patch = { locked: false };

  // Lock/unlock hanya berlaku untuk topik.
  if (target_type === "comment" && (action === "lock" || action === "unlock")) {
    return jsonError("Aksi lock hanya berlaku untuk topik.", 422);
  }

  const { data, error } = await supabase
    .from(table)
    .update(patch)
    .eq("id", target_id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return jsonError(`${target_type === "topic" ? "Topik" : "Komentar"} tidak ditemukan atau gagal diperbarui.`, 404);
  }

  await writeAuditLog({
    actorId: user.id,
    action: `forum.${action}`,
    entityType: target_type,
    entityId: target_id,
  });

  return jsonOk();
}
