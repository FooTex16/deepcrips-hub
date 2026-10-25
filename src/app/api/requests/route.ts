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

  // Batas lampiran — selaras dengan migration 000009 & form client.
  const MAX_SCREENSHOTS = 6;
  const MAX_ATTACHMENTS = 5;
  const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
  const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/request-files/`;
  const isStorageUrl = (v: string) => v.startsWith(storagePrefix);

  const body = await parseBody(
    request,
    z.object({
      title: cleanText(160).refine((s) => s.length >= 3, "Judul minimal 3 karakter."),
      request_type: z.enum(["file", "tutorial", "video", "game", "other"]),
      game_id: z.string().uuid().nullish(),
      description: cleanText(4000).refine((s) => s.length >= 10, "Deskripsi minimal 10 karakter."),
      // Opsional: script/teks tempel, screenshot preview, file lampiran.
      script_text: z.string().max(20000).optional(),
      screenshots: z
        .array(z.string().max(500).refine(isStorageUrl, "URL screenshot harus berasal dari Storage situs ini."))
        .max(MAX_SCREENSHOTS, `Maksimal ${MAX_SCREENSHOTS} screenshot.`)
        .optional(),
      attachments: z
        .array(
          z.object({
            name: z
              .string()
              .min(1)
              .max(255)
              .refine((s) => !/[\\/]/.test(s), "Nama file tidak boleh mengandung path."),
            url: z.string().max(500).refine(isStorageUrl, "URL lampiran harus berasal dari Storage situs ini."),
            size: z.number().int().min(1).max(MAX_FILE_BYTES, "Ukuran file melebihi 5 MB."),
            type: z.string().max(128).default("application/octet-stream"),
          })
        )
        .max(MAX_ATTACHMENTS, `Maksimal ${MAX_ATTACHMENTS} file lampiran.`)
        .optional(),
    })
  );
  if ("response" in body) return body.response;
  const { title, request_type, game_id, description, script_text, screenshots, attachments } = body.data;
  const scriptText = script_text && script_text.trim() ? script_text : null;

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
      script_text: scriptText,
      screenshots: screenshots ?? [],
      attachments: attachments ?? [],
      requester_id: user.id,
    })
    .select("id, title, status")
    .single();

  if (error) {
    return jsonError("Permintaan gagal dibuat.", 500);
  }
  return jsonOk({ request: created }, { status: 201 });
}
