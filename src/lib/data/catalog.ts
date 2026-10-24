import { createClient } from "@/lib/supabase/server";
import type { FileItem, Game, Tutorial, Video } from "@/lib/types";

export const FILE_PAGE_SIZE = 12;

export interface FileFilters {
  q?: string;
  game?: string; // slug game
  category?: string;
  availability?: "available" | "any";
  updatedWithin?: "7d" | "30d" | "90d";
  page?: number;
}

export interface Paged<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}

/** Katalog file dengan pencarian + filter (query server, paginasi). */
export async function listPublishedFiles(filters: FileFilters): Promise<Paged<FileItem>> {
  const page = Math.max(1, filters.page ?? 1);
  try {
    const supabase = await createClient();
    let query = supabase
      .from("files")
      .select("*, game:games(id, slug, title, cover_url, genre)", { count: "exact" })
      .eq("status", "published");

    if (filters.q) {
      query = query.textSearch("search_tsv", filters.q, { config: "simple", type: "websearch" });
    }
    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.game) {
      const { data: gameRow } = await supabase.from("games").select("id").eq("slug", filters.game).maybeSingle();
      if (gameRow) {
        query = query.eq("game_id", (gameRow as { id: string }).id);
      } else {
        return { items: [], count: 0, page, totalPages: 0 };
      }
    }
    if (filters.updatedWithin) {
      const days = filters.updatedWithin === "7d" ? 7 : filters.updatedWithin === "30d" ? 30 : 90;
      query = query.gte("published_at", new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
    }

    const from = (page - 1) * FILE_PAGE_SIZE;
    const { data, count, error } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + FILE_PAGE_SIZE - 1);

    if (error) return { items: [], count: 0, page, totalPages: 0 };
    let items = (data ?? []) as unknown as FileItem[];

    if (filters.availability === "available") {
      // Hanya file yang punya minimal satu versi available + host aktif.
      try {
        const supabase2 = await createClient();
        const ids = items.map((f) => f.id);
        const { data: versions } = await supabase2
          .from("file_versions")
          .select("file_id, id, download_hosts!inner(id)")
          .in("file_id", ids)
          .eq("status", "available")
          .eq("download_hosts.is_active", true);
        const availableFileIds = new Set((versions ?? []).map((v: { file_id: string }) => v.file_id));
        items = items.filter((f) => availableFileIds.has(f.id));
      } catch {
        /* biarkan daftar apa adanya */
      }
    }

    const total = count ?? items.length;
    return { items, count: total, page, totalPages: Math.ceil(total / FILE_PAGE_SIZE) };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getFileBySlug(slug: string): Promise<FileItem | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("files")
      .select("*, game:games(id, slug, title, cover_url, genre)")
      .eq("slug", slug)
      .maybeSingle();
    return (data as FileItem | null) ?? null;
  } catch {
    return null;
  }
}

export interface FileVersionWithHosts {
  id: string;
  file_id: string;
  version_label: string;
  release_notes: string | null;
  released_at: string | null;
  sha256: string | null;
  compatibility: string | null;
  status: "available" | "deprecated" | "unavailable";
  is_latest: boolean;
  hosts: Array<{
    id: string;
    name: string;
    is_active: boolean;
    status: "active" | "inactive" | "reported_broken";
    priority: number;
    status_note: string | null;
    last_checked_at: string | null;
  }>;
}

/**
 * Versi + metadata host (TANPA kolom url — URL hanya lewat /api/download
 * yang mewajibkan login & mencatat klik).
 */
export async function getFileVersions(fileId: string): Promise<FileVersionWithHosts[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("file_versions")
      .select(
        "id, file_id, version_label, release_notes, released_at, sha256, compatibility, status, is_latest, " +
          "hosts:download_hosts(id, name, is_active, status, priority, status_note, last_checked_at)"
      )
      .eq("file_id", fileId)
      .order("released_at", { ascending: false, nullsFirst: false });
    const rows = (data ?? []) as unknown as FileVersionWithHosts[];
    for (const row of rows) {
      row.hosts = [...(row.hosts ?? [])].sort((a, b) => {
        const aOk = a.is_active && a.status === "active" ? 0 : 1;
        const bOk = b.is_active && b.status === "active" ? 0 : 1;
        return aOk - bOk || a.priority - b.priority;
      });
    }
    return rows;
  } catch {
    return [];
  }
}

/** List game published dengan pencarian + filter genre + pagination. */
export const GAME_PAGE_SIZE = 12;

export async function listPublishedGames(params: {
  q?: string;
  genre?: string;
  page?: number;
}): Promise<Paged<Game>> {
  const page = Math.max(1, params.page ?? 1);
  try {
    const supabase = await createClient();
    let query = supabase.from("games").select("*", { count: "exact" }).eq("status", "published");
    if (params.q) {
      query = query.textSearch("search_tsv", params.q, { config: "simple", type: "websearch" });
    }
    if (params.genre) {
      query = query.eq("genre", params.genre);
    }
    const from = (page - 1) * GAME_PAGE_SIZE;
    const { data, count } = await query
      .order("title", { ascending: true })
      .range(from, from + GAME_PAGE_SIZE - 1);
    const total = count ?? 0;
    return { items: (data ?? []) as Game[], count: total, page, totalPages: Math.ceil(total / GAME_PAGE_SIZE) };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("games").select("*").eq("slug", slug).maybeSingle();
    return (data as Game | null) ?? null;
  } catch {
    return null;
  }
}

export async function getGameGenres(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("games")
      .select("genre")
      .eq("status", "published")
      .not("genre", "is", null)
      .order("genre");
    return Array.from(new Set((data ?? []).map((g: { genre: string }) => g.genre)));
  } catch {
    return [];
  }
}

/** Konten terkait satu game (dipakai tab di halaman detail game). */
export async function getGameContent(slug: string): Promise<{
  files: FileItem[];
  tutorials: Tutorial[];
  videos: Video[];
}> {
  try {
    const supabase = await createClient();
    const { data: game } = await supabase.from("games").select("id").eq("slug", slug).maybeSingle();
    if (!game) return { files: [], tutorials: [], videos: [] };
    const gameId = (game as { id: string }).id;
    const [files, tutorials, videos] = await Promise.all([
      supabase
        .from("files")
        .select("*, game:games(id, slug, title, cover_url, genre)")
        .eq("game_id", gameId)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("tutorials")
        .select("*, game:games(id, slug, title)")
        .eq("game_id", gameId)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
      supabase
        .from("videos")
        .select("*")
        .eq("game_id", gameId)
        .eq("status", "published")
        .order("published_at", { ascending: false }),
    ]);
    return {
      files: (files.data ?? []) as unknown as FileItem[],
      tutorials: (tutorials.data ?? []) as unknown as Tutorial[],
      videos: (videos.data ?? []) as unknown as Video[],
    };
  } catch {
    return { files: [], tutorials: [], videos: [] };
  }
}

export const TUTORIAL_PAGE_SIZE = 9;

export async function listPublishedTutorials(params: {
  q?: string;
  category?: string;
  page?: number;
}): Promise<Paged<Tutorial>> {
  const page = Math.max(1, params.page ?? 1);
  try {
    const supabase = await createClient();
    let query = supabase
      .from("tutorials")
      .select("*, game:games(id, slug, title)", { count: "exact" })
      .eq("status", "published");
    if (params.q) query = query.textSearch("search_tsv", params.q, { config: "simple", type: "websearch" });
    if (params.category) query = query.eq("category", params.category);
    const from = (page - 1) * TUTORIAL_PAGE_SIZE;
    const { data, count } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + TUTORIAL_PAGE_SIZE - 1);
    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as Tutorial[],
      count: total,
      page,
      totalPages: Math.ceil(total / TUTORIAL_PAGE_SIZE),
    };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getTutorialBySlug(slug: string): Promise<Tutorial | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tutorials")
      .select("*, game:games(id, slug, title)")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Tutorial | null) ?? null;
  } catch {
    return null;
  }
}

export const VIDEO_PAGE_SIZE = 12;

export async function listPublishedVideos(params: {
  q?: string;
  category?: string;
  page?: number;
}): Promise<Paged<Video>> {
  const page = Math.max(1, params.page ?? 1);
  try {
    const supabase = await createClient();
    let query = supabase.from("videos").select("*", { count: "exact" }).eq("status", "published");
    if (params.q) query = query.textSearch("search_tsv", params.q, { config: "simple", type: "websearch" });
    if (params.category) query = query.eq("category", params.category);
    const from = (page - 1) * VIDEO_PAGE_SIZE;
    const { data, count } = await query
      .order("published_at", { ascending: false, nullsFirst: false })
      .range(from, from + VIDEO_PAGE_SIZE - 1);
    const total = count ?? 0;
    return {
      items: (data ?? []) as unknown as Video[],
      count: total,
      page,
      totalPages: Math.ceil(total / VIDEO_PAGE_SIZE),
    };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("videos").select("*").eq("slug", slug).maybeSingle();
    return (data as Video | null) ?? null;
  } catch {
    return null;
  }
}
