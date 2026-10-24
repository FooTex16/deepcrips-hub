import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, cleanText, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/requests — ajukan permintaan konten (anggota login).
 * Status selalu 'pending' (hanya admin yang dapat mengubah status).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`request:create:${user.id}`, 3, 30 * 60_000);
  if (!limit.ok) {
    return jsonError(`Anda mengajukan permintaan terlalu cepat. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
  }

  const body = await parseBody(
    request,
    z.object({
      title: cleanText(160).refine((s) => s.length >= 3, "Judul minimal 3 karakter."),
      request_type: z.enum(["file", "tutorial", "video", "game", "other"]),
      game_id: z.string().uuid().nullish(),
      description: cleanText(4000).refine((s) => s.length >= 10, "Deskripsi minimal 10 karakter."),
    })
  );
  if ("response" in body) return body.response;
  const { title, request_type, game_id, description } = body.data;

  const supabase = await createClient();

  // Deteksi duplikat (fleksibel): judul serupa milik user lain yang belum
  // ditolak — diarahkan agar mendukung permintaan yang sudah ada.
  const terms = title
    .split(/\s+/)
    .map((w) => w.replace(/[%_,()\\]/g, ""))
    .filter((w) => w.length >= 3)
    .slice(0, 3);
  let dupQuery = supabase
    .from("content_requests")
    .select("id, title, status, vote_count")
    .neq("requester_id", user.id)
    .neq("status", "rejected");
  if (terms.length > 0) {
    dupQuery = dupQuery.or(terms.map((t) => `title.ilike.%${t}%`).join(","));
  }
  const { data: similar } = await dupQuery.limit(5);

  const duplicates = (similar ?? []) as Array<{ id: string; title: string; status: string; vote_count: number }>;
  if (duplicates.length > 0) {
    return jsonError(
      "Permintaan serupa sudah ada — pertimbangkan untuk memberi dukungan pada permintaan tersebut.",
      409,
      { duplicates }
    );
  }

  const { data: created, error } = await supabase
    .from("content_requests")
    .insert({
      title,
      request_type,
      game_id: game_id ?? null,
      description,
      requester_id: user.id,
    })
    .select("id, title, status")
    .single();

  if (error) {
    return jsonError("Permintaan gagal dibuat.", 500);
  }
  return jsonOk({ request: created }, { status: 201 });
}
