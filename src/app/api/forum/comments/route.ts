import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, cleanText, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/forum/comments — balasan pada topik.
 * Topik terkunci/tersembunyi ditolak oleh RLS & pemeriksaan ini.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`forum:comment:${user.id}`, 10, 5 * 60_000);
  if (!limit.ok) {
    return jsonError(`Anda berkomentar terlalu cepat. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
  }

  const body = await parseBody(
    request,
    z.object({
      topic_id: z.string().uuid(),
      body: cleanText(10000),
      parent_id: z.string().uuid().nullish(),
    })
  );
  if ("response" in body) return body.response;
  const { topic_id, body: text, parent_id } = body.data;

  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, locked, hidden")
    .eq("id", topic_id)
    .maybeSingle();

  if (!topic || (topic as { hidden: boolean }).hidden) {
    return jsonError("Topik tidak ditemukan.", 404);
  }
  if ((topic as { locked: boolean }).locked) {
    return jsonError("Topik dikunci — komentar baru tidak diterima.", 403);
  }

  if (parent_id) {
    const { data: parent } = await supabase
      .from("forum_comments")
      .select("id, topic_id")
      .eq("id", parent_id)
      .maybeSingle();
    if (!parent || (parent as { topic_id: string }).topic_id !== topic_id) {
      return jsonError("Balasan induk tidak valid.", 422);
    }
  }

  const { data: created, error } = await supabase
    .from("forum_comments")
    .insert({
      topic_id,
      author_id: user.id,
      parent_id: parent_id ?? null,
      body: text,
    })
    .select("id")
    .single();

  if (error) {
    return jsonError("Komentar gagal dibuat.", 500);
  }
  return jsonOk({ comment: created }, { status: 201 });
}
