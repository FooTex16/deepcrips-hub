import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { REACTION_EMOJIS } from "@/lib/types";

const bodySchema = z.object({
  target_type: z.enum(["topic", "comment"]),
  target_id: z.string().uuid(),
  emoji: z.enum(REACTION_EMOJIS),
  action: z.enum(["add", "remove"]),
});

/**
 * POST /api/forum/reactions — tambah/hapus reaksi emoji.
 * Anti-duplikasi dijamin unique partial index di database; endpoint ini
 * menangani kasus "sudah ada" secara idempoten.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`forum:reaction:${user.id}`, 60, 60_000);
  if (!limit.ok) {
    return jsonError("Terlalu banyak permintaan reaksi. Tunggu sebentar.", 429);
  }

  const body = await parseBody(request, bodySchema);
  if ("response" in body) return body.response;
  const { target_type, target_id, emoji, action } = body.data;

  const supabase = await createClient();
  const column = target_type === "topic" ? "topic_id" : "comment_id";

  if (action === "remove") {
    const { error } = await supabase
      .from("forum_reactions")
      .delete()
      .eq("user_id", user.id)
      .eq(column, target_id)
      .eq("emoji", emoji);
    if (error) return jsonError("Gagal menghapus reaksi.", 500);
    return jsonOk();
  }

  const { error } = await supabase
    .from("forum_reactions")
    .insert({ user_id: user.id, [column]: target_id, emoji });

  if (error) {
    // 23505 = unique violation ⇒ reaksi sudah ada, perlakukan sebagai sukses.
    if (error.code === "23505") return jsonOk({ already: true });
    return jsonError("Gagal menambahkan reaksi.", 500);
  }
  return jsonOk({}, { status: 201 });
}
