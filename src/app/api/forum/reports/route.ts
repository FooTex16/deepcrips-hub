import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, cleanText, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/forum/reports — laporkan topik/komentar.
 * Maksimal satu laporan terbuka per user per target (unique partial index).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`forum:report:${user.id}`, 5, 10 * 60_000);
  if (!limit.ok) {
    return jsonError(`Terlalu banyak laporan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
  }

  const body = await parseBody(
    request,
    z.object({
      target_type: z.enum(["topic", "comment"]),
      target_id: z.string().uuid(),
      reason: cleanText(60),
      details: cleanText(2000).nullish(),
    })
  );
  if ("response" in body) return body.response;
  const { target_type, target_id, reason, details } = body.data;

  const supabase = await createClient();
  const column = target_type === "topic" ? "topic_id" : "comment_id";

  const { error } = await supabase.from("content_reports").insert({
    reporter_id: user.id,
    [column]: target_id,
    reason,
    details: details ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return jsonError("Anda sudah melaporkan konten ini dan laporan masih terbuka.", 409);
    }
    return jsonError("Laporan gagal dikirim.", 500);
  }
  return jsonOk({}, { status: 201 });
}
