import { createClient } from "@/lib/supabase/server";
import type { GlobalSearchResult } from "@/lib/types";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export interface SearchOutcome {
  results: GlobalSearchResult[];
  total: number;
  page: number;
  totalPages: number;
  suggestions?: string[];
  error?: "rate_limited" | "unconfigured" | "failed";
}

export const SEARCH_PAGE_SIZE = 10;

/**
 * Pencarian global server-side (PostgreSQL) — game, file, tutorial, video.
 * Hanya konten published (dijamin fungsi SQL + RLS). Fallback query per-tabel
 * bila fungsi global_search belum tersedia (migrasi belum diterapkan).
 */
export async function searchContent(q: string, page = 1, type = "all"): Promise<SearchOutcome> {
  const query = (q ?? "").trim();
  const safePage = Math.max(1, Number(page) || 1);
  if (query.length < 2) return { results: [], total: 0, page: safePage, totalPages: 0 };

  try {
    const supabase = await createClient();
    const offset = (safePage - 1) * SEARCH_PAGE_SIZE;

    const { data, error } = await supabase.rpc("global_search", {
      p_query: query,
      p_limit: SEARCH_PAGE_SIZE,
      p_offset: offset,
    });

    if (error) {
      return fallbackSearch(supabase, query, safePage, type);
    }

    let results = (data ?? []) as GlobalSearchResult[];
    const { data: all } = await supabase.rpc("global_search", {
      p_query: query,
      p_limit: 50,
      p_offset: 0,
    });
    let total = ((all ?? []) as GlobalSearchResult[]).length;
    if (type !== "all") {
      results = results.filter((r) => r.source === type);
      total = ((all ?? []) as GlobalSearchResult[]).filter((r) => r.source === type).length;
    }

    return {
      results,
      total,
      page: safePage,
      totalPages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
      suggestions: total === 0 ? suggestForKeyword(query) : undefined,
    };
  } catch {
    return {
      results: [],
      total: 0,
      page: safePage,
      totalPages: 0,
      error: "unconfigured",
    };
  }
}

/** Rate limit untuk endpoint pencarian (per IP). */
export function checkSearchRate(request: Request): SearchOutcome | null {
  const limit = rateLimit(`search:${clientIp(request)}`, 60, 60_000);
  if (!limit.ok) {
    return { results: [], total: 0, page: 1, totalPages: 0, error: "rate_limited" };
  }
  return null;
}

export function suggestForKeyword(q: string): string[] {
  const generic = ["script", "tutorial", "mod", "tools", "config", "Android", "PC"];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return generic.filter((s) => !words.some((w) => s.toLowerCase().includes(w))).slice(0, 4);
}

async function fallbackSearch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  q: string,
  page: number,
  type: string
): Promise<SearchOutcome> {
  const clean = q.replace(/[%_,()\\]/g, "");
  const like = `%${clean}%`;
  const want = (t: string) => type === "all" || type === t;

  const maybe = (enabled: boolean, builder: () => PromiseLike<{ data: unknown }>) =>
    enabled ? builder() : Promise.resolve({ data: [] as unknown[] });

  const [games, files, tutorials, videos] = await Promise.all([
    maybe(want("game"), () =>
      supabase.from("games").select("id, slug, title, summary").eq("status", "published").or(`title.ilike.${like},summary.ilike.${like}`).limit(SEARCH_PAGE_SIZE)
    ),
    maybe(want("file"), () =>
      supabase.from("files").select("id, slug, title, summary").eq("status", "published").or(`title.ilike.${like},summary.ilike.${like}`).limit(SEARCH_PAGE_SIZE)
    ),
    maybe(want("tutorial"), () =>
      supabase.from("tutorials").select("id, slug, title, summary").eq("status", "published").or(`title.ilike.${like},summary.ilike.${like}`).limit(SEARCH_PAGE_SIZE)
    ),
    maybe(want("video"), () =>
      supabase.from("videos").select("id, slug, title, description").eq("status", "published").or(`title.ilike.${like}`).limit(SEARCH_PAGE_SIZE)
    ),
  ]);

  const toResults = (
    rows: unknown,
    source: GlobalSearchResult["source"],
    subtitleKey: "summary" | "description",
    basePath: string
  ): GlobalSearchResult[] =>
    ((rows ?? []) as Array<Record<string, string>>).map((r, i) => ({
      source,
      id: r.id,
      slug: r.slug,
      title: r.title,
      subtitle: r[subtitleKey] ?? "",
      url: `${basePath}/${r.slug}`,
      rank: 1 - i * 0.01,
    }));

  const results = [
    ...toResults(games.data, "game", "summary", "/games"),
    ...toResults(files.data, "file", "summary", "/downloads"),
    ...toResults(tutorials.data, "tutorial", "summary", "/tutorials"),
    ...toResults(videos.data, "video", "description", "/videos"),
  ].slice(0, SEARCH_PAGE_SIZE);

  return {
    results,
    total: results.length,
    page: 1,
    totalPages: 1,
    suggestions: results.length === 0 ? suggestForKeyword(q) : undefined,
  };
}
