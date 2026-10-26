/**
 * Impor video YouTube tanpa API key memakai feed resmi YouTube (Atom RSS).
 *
 * - Channel diterima sebagai: ID "UC…", URL /channel/UC…, /@handle, /user/…,
 *   /c/…, atau handle polos "@name" → dirender ke halaman channel untuk
 *   menemukan channelId (regex pada data awal halaman).
 * - Feed `videos.xml` berisi 15 video terbaru: judul, videoId, tanggal,
 *   thumbnail, deskripsi.
 * Semua panggilan jaringan dibatasi timeout & tanpa cookie/otorisasi.
 */

export interface YtFeedEntry {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  description: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchText(url: string, ms = 10_000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      // data YouTube boleh di-cache singkat agar klik impor berulang cepat.
      next: { revalidate: 0 },
    } as RequestInit);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Dekode entitas XML dasar (&amp; &lt; &gt; &quot; &apos; &#39; &#x27;). */
function decodeXml(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Ambil teks pertama antar tag (regex sederhana untuk Atom YouTube). */
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  let inner = m[1].trim();
  // CDATA: <![CDATA[ … ]]>
  const cdata = inner.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdata) inner = cdata[1];
  return decodeXml(inner.trim());
}

/**
 * Normalisasi input channel menjadi channelId "UC…".
 * Lempar Error dengan pesan ramah bila tidak bisa diparsing.
 */
export async function resolveChannelId(input: string): Promise<string> {
  const raw = input.trim();
  if (!raw) throw new Error("Channel YouTube kosong.");

  // Sudah ID channel.
  if (/^UC[\w-]{22}$/.test(raw)) return raw;

  // URL / handle.
  let path = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (!/(^|\.)youtube\.com$/i.test(u.hostname) && !/(^|\.)youtu\.be$/i.test(u.hostname)) {
        throw new Error("URL harus youtube.com (contoh: https://www.youtube.com/@namachannel).");
      }
      path = u.pathname;
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("URL harus")) throw e;
      throw new Error("URL channel tidak valid.");
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;

  const direct = path.match(/\/channel\/(UC[\w-]{22})/);
  if (direct) return direct[1];

  // Halaman channel (/@handle, /user/x, /c/x) → cari channelId.
  // Prioritas: canonical/externalId/meta milik halaman INI dulu —
  // "channelId" generik bisa saja milik channel terkait (gridChannelRenderer).
  const html = await fetchText(`https://www.youtube.com${path}`);
  const found =
    html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})/) ??
    html.match(/"externalId":"(UC[\w-]{22})"/) ??
    html.match(/<meta itemprop="channelId" content="(UC[\w-]{22})"/) ??
    html.match(/"channelId":"(UC[\w-]{22})"/);
  if (!found) {
    throw new Error(
      "Channel tidak ditemukan. Pastikan benar (contoh: @DeepCrips atau https://www.youtube.com/@DeepCrips)."
    );
  }
  return found[1];
}

/** Ambil daftar video terbaru dari feed channel (maksimal 15 dari YouTube). */
export async function fetchChannelFeed(channelId: string, limit: number): Promise<YtFeedEntry[]> {
  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  );
  const blocks = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const entries: YtFeedEntry[] = [];
  for (const block of blocks) {
    if (entries.length >= Math.min(limit, 15)) break;
    const videoId = pick(block, "yt:videoId");
    if (!videoId) continue;
    const title = pick(block, "title");
    if (!title) continue;
    const thumbMatch = block.match(/<media:thumbnail url="([^"]+)"/);
    entries.push({
      videoId,
      title: title.slice(0, 180),
      published: pick(block, "published"),
      thumbnail: thumbMatch ? decodeXml(thumbMatch[1]) : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: pick(block, "media:description").slice(0, 4000),
    });
  }
  if (entries.length === 0) {
    throw new Error("Feed channel kosong atau tidak berisi video.");
  }
  return entries;
}

/** Ekstrak videoId YouTube dari URL apa pun (untuk deduplikasi). */
export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, "") === "youtu.be") return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{6,})/);
    if (m) return m[2];
  } catch {
    /* abaikan */
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fallback: scrape halaman /videos channel.
//
// Sejak Desember 2025 endpoint RSS YouTube (feeds/videos.xml) sering menjawab
// 404/500 secara intermittent — terutama dari IP datacenter (Vercel/AWS) dan
// pada jendela waktu tertentu. Halaman channel tetap bisa dibaca, jadi bila
// feed gagal kita ambil daftar video dari ytInitialData halaman tersebut
// (tanpa API key, tanpa cookie).
// ---------------------------------------------------------------------------

/** Ambil objek JSON ytInitialData dari HTML halaman (pemindai kurung yang
 *  menghormati string/escape — lebih tangguh daripada regex). */
function extractYtInitialData(html: string): string | null {
  const marker = html.indexOf("var ytInitialData =");
  if (marker < 0) return null;
  const start = html.indexOf("{", marker);
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

/** Ubah teks relatif YouTube ("1mo ago", "2 weeks ago") → ISO 8601.
 *  Bila tidak dikenal → "" (route akan memakai waktu sekarang). */
function relativeToIso(text: string): string {
  const m = text.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i);
  if (!m) return "";
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const ms: Record<string, number> = {
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
    month: 2_592_000_000,
    year: 31_536_000_000,
  };
  return new Date(Date.now() - n * (ms[unit] ?? 0)).toISOString();
}

/** Kumpulkan entri video dari ytInitialData — mendukung UI baru
 *  (lockupViewModel) dan UI lama (videoRenderer). */
function collectVideoEntries(data: unknown, limit: number): YtFeedEntry[] {
  const out: YtFeedEntry[] = [];
  const seen = new Set<string>();
  const seenObj = new Set<unknown>();

  const visit = (node: unknown): void => {
    if (out.length >= limit * 3 || node === null || typeof node !== "object") return;
    if (seenObj.has(node)) return;
    seenObj.add(node);
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    const obj = node as Record<string, unknown>;

    // UI lama: videoRenderer
    const legacy = obj.videoRenderer as Record<string, unknown> | undefined;
    if (legacy && typeof legacy.videoId === "string") {
      const title = ((legacy.title as { runs?: Array<{ text?: string }> } | undefined)?.runs ?? [])
        .map((r) => r.text ?? "")
        .join("");
      const published =
        (legacy.publishedTimeText as { simpleText?: string } | undefined)?.simpleText ?? "";
      const thumbs = (legacy.thumbnail as { thumbnails?: Array<{ url?: string }> } | undefined)
        ?.thumbnails;
      push({
        videoId: legacy.videoId,
        title,
        published,
        thumbnail: thumbs && thumbs.length ? (thumbs[thumbs.length - 1].url ?? "") : "",
        description:
          (legacy.descriptionSnippet as { runs?: Array<{ text?: string }> } | undefined)?.runs
            ?.map((r) => r.text ?? "")
            .join("") ?? "",
      });
      return;
    }

    // UI baru: lockupViewModel (richItemRenderer → lockupViewModel)
    const lock = obj.lockupViewModel as Record<string, unknown> | undefined;
    if (
      lock &&
      lock.contentType === "LOCKUP_CONTENT_TYPE_VIDEO" &&
      typeof lock.contentId === "string"
    ) {
      const meta = lock.metadata as
        | { lockupMetadataViewModel?: Record<string, unknown> }
        | undefined;
      const lm = meta?.lockupMetadataViewModel;
      const title = String(
        ((lm?.title as { content?: string } | undefined)?.content ?? "").slice(0, 180)
      );
      // metadataRows: bagian terakhir biasanya usia video ("1mo ago")
      const rows = (
        (lm?.metadata as { contentMetadataViewModel?: { metadataRows?: unknown[] } } | undefined)
          ?.contentMetadataViewModel?.metadataRows ?? []
      ) as Array<{ metadataParts?: Array<{ text?: { content?: string } }> }>;
      let published = "";
      for (const row of rows) {
        for (const part of row.metadataParts ?? []) {
          const c = part.text?.content ?? "";
          if (/\bago\b/i.test(c)) published = c;
        }
      }
      const sources = (
        (lock.contentImage as
          | { thumbnailViewModel?: { image?: { sources?: Array<{ url?: string }> } } }
          | undefined)?.thumbnailViewModel?.image?.sources ?? []
      );
      push({
        videoId: lock.contentId,
        title,
        published,
        thumbnail: sources.length ? (sources[sources.length - 1].url ?? "") : "",
        description: "",
      });
      return;
    }

    for (const key of Object.keys(obj)) visit(obj[key]);
  };

  const push = (e: YtFeedEntry): void => {
    if (!e.videoId || !e.title || seen.has(e.videoId)) return;
    seen.add(e.videoId);
    if (!e.thumbnail) e.thumbnail = `https://i.ytimg.com/vi/${e.videoId}/hqdefault.jpg`;
    e.published = relativeToIso(e.published);
    out.push(e);
  };

  visit(data);
  return out.slice(0, limit);
}

/** Fallback: ambil daftar video dari halaman /videos channel (RSS 404). */
async function fetchChannelVideosPage(channelId: string, limit: number): Promise<YtFeedEntry[]> {
  const html = await fetchText(`https://www.youtube.com/channel/${channelId}/videos`);
  const raw = extractYtInitialData(html);
  if (!raw) throw new Error("Halaman video channel tidak dapat dibaca. Coba lagi nanti.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Halaman video channel tidak dapat dibaca. Coba lagi nanti.");
  }
  const entries = collectVideoEntries(data, Math.min(limit, 15));
  if (entries.length === 0) {
    throw new Error("Tidak menemukan video di halaman channel.");
  }
  return entries;
}

/**
 * Tarik video terbaru sebuah channel: coba feed RSS resmi dulu, lalu fallback
 * ke halaman /videos bila RSS gagal (gangguan 404/500 yang dikenal sejak
 * Desember 2025). Mengembalikan channelId + daftar entri.
 */
export async function fetchLatestVideos(
  input: string,
  limit: number
): Promise<{ channelId: string; entries: YtFeedEntry[] }> {
  const channelId = await resolveChannelId(input);
  try {
    const entries = await fetchChannelFeed(channelId, limit);
    return { channelId, entries };
  } catch {
    const entries = await fetchChannelVideosPage(channelId, limit);
    return { channelId, entries };
  }
}
