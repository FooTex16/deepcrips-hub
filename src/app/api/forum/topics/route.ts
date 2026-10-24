import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, cleanText, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

/**
 * POST /api/forum/topics — buat topik baru (anggota login).
 * Rate limit + validasi + RLS (author_id = auth.uid()).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`forum:topic:${user.id}`, 3, 10 * 60_000);
  if (!limit.ok) {
    return jsonError(`Anda membuat topik terlalu cepat. Coba lagi dalam ${limit.retryAfterSeconds} detik.`, 429);
  }

  const body = await parseBody(
    request,
    z.object({
      title: cleanText(160).refine((s) => s.length >= 3, "Judul minimal 3 karakter."),
      body: cleanText(20000),
      game_id: z.string().uuid().nullish(),
    })
  );
  if ("response" in body) return body.response;
  const { title, body: text, game_id } = body.data;

  const supabase = await createClient();

  // Slug unik: base + suffix acak saat tabrakan.
  const base = slugify(title) || "topik";
  let slug = base;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { error } = await supabase
      .from("forum_topics")
      .insert({ slug, title, body: text, author_id: user.id, game_id: game_id ?? null });
    if (!error) {
      const { data: created } = await supabase
        .from("forum_topics")
        .select("id, slug")
        .eq("slug", slug)
        .maybeSingle();
      return jsonOk({ topic: created }, { status: 201 });
    }
    if (!error.message.includes("duplicate") && !error.message.includes("Unique")) {
      return jsonError("Topik gagal dibuat. Periksa kembali isian Anda.", 500);
    }
    slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  return jsonError("Gagal membuat slug unik. Coba judul yang sedikit berbeda.", 409);
}
