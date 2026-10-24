/**
 * Helper YouTube: ekstrak ID video untuk thumbnail statis.
 * Halaman video memakai thumbnail + link keluar (lazy), BUKAN embed iframe
 * berjajar — sesuai PRD performa.
 */

export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return /^[a-zA-Z0-9_-]{6,15}$/.test(id) ? id : null;
    }
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && /^[a-zA-Z0-9_-]{6,15}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(shorts|embed)\/([a-zA-Z0-9_-]{6,15})/);
      if (m) return m[2];
    }
  } catch {
    return null;
  }
  return null;
}

/** Thumbnail YouTube resmi (statis, dioptimalkan next/image). */
export function youtubeThumbnail(
  url: string | null | undefined,
  quality: "hqdefault" | "mqdefault" | "maxresdefault" = "hqdefault"
): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : null;
}

/** URL tonton normalisasi. */
export function youtubeWatchUrl(url: string | null | undefined): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}
