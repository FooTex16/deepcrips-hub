import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseBody, jsonError, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/lib/admin-crud";
import { rateLimit as rateLimitFn } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { fetchLatestVideos, extractVideoId, type YtFeedEntry } from "@/lib/youtube-import";

const importSchema = z.object({
  channel: z.string().trim().min(1, "Channel wajib diisi.").max(300),
  limit: z.coerce.number().int().min(1).max(15).default(10),
  status: z.enum(["published", "draft"]).default("published"),
});

/**
 * POST /api/admin/videos/import — tarik video terbaru dari channel YouTube
 * (feed resmi RSS, tanpa API key) dan buat postingan video sekaligus.
 * Video yang sudah pernah diimpor (berdasar videoId) dilewati.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin("content_admin");
  if ("response" in guard) return guard.response;
  const { user } = guard;

  const limit = rateLimitFn(`admin:videos:import:${user.id}`, 6, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan impor. Tunggu sebentar.", 429);

  const body = await parseBody(request, importSchema);
  if ("response" in body) return body.response;
  const { channel, limit: max, status } = body.data;

  // 1) Channel → channelId → video terbaru (RSS, fallback halaman /videos).
  let entries: YtFeedEntry[];
  let channelId: string;
  try {
    ({ channelId, entries } = await fetchLatestVideos(channel, max));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Gagal menghubungi YouTube.", 502);
  }

  try {
    const supabase = await createClient();

    // 2) Deduplikasi: kumpulkan videoId yang sudah ada di database.
    const ids = entries.map((e) => e.videoId);
    const { data: existingRows } = await supabase
      .from("videos")
      .select("video_url")
      .or(ids.map((id) => `video_url.ilike.%${id}%`).join(","));
    const existingIds = new Set(
      (existingRows ?? [])
        .map((r) => extractVideoId(r.video_url ?? ""))
        .filter((v): v is string => Boolean(v))
    );

    // 3) Susun baris baru.
    const now = new Date().toISOString();
    const rows: Array<Record<string, unknown>> = [];
    const seenInBatch = new Set<string>();
    for (const e of entries) {
      if (existingIds.has(e.videoId) || seenInBatch.has(e.videoId)) continue;
      seenInBatch.add(e.videoId);
      const base = (slugify(e.title) || "video").slice(0, 96);
      const idPart = e.videoId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const published = Number.isNaN(Date.parse(e.published)) ? now : e.published;
      rows.push({
        title: e.title,
        slug: `${base}-${idPart}`.slice(0, 120),
        video_url: `https://www.youtube.com/watch?v=${e.videoId}`,
        thumbnail_url: e.thumbnail,
        description: e.description || null,
        category: "channel",
        status,
        published_at: published,
        game_id: null,
        duration_seconds: null,
        // RLS videos_insert menuntut created_by = auth.uid().
        created_by: user.id,
      });
    }

    if (rows.length === 0) {
      return jsonOk({
        imported: 0,
        skipped: entries.length,
        channelId,
        message: "Semua video terbaru sudah ada di situs.",
      });
    }

    const { error } = await supabase.from("videos").insert(rows);
    if (error) return jsonError(`Gagal menyimpan video: ${error.message}`, 400);

    // 4) Ingat channel untuk impor berikutnya (hanya bila berhak menulis
    //    pengaturan — diabaikan diam-diam bila ditolak RLS).
    try {
      await supabase.from("site_settings").upsert({
        key: "youtube_channel",
        value: { channel, channelId },
        description: "Channel YouTube untuk impor video terbaru.",
        updated_by: user.id,
      });
    } catch {
      /* non-kritis */
    }

    await writeAuditLog({
      actorId: user.id,
      action: "video.import",
      entityType: "videos",
      entityId: null,
    });

    return jsonOk({
      imported: rows.length,
      skipped: entries.length - rows.length,
      channelId,
    });
  } catch {
    return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
  }
}
