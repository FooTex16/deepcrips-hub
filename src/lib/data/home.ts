import { createPublicClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FileItem, ForumTopic, Game, Tutorial, Video } from "@/lib/types";
import {
  TEMPLATE_FILES,
  TEMPLATE_GAMES,
  TEMPLATE_TUTORIALS,
  TEMPLATE_TOPICS,
  TEMPLATE_VIDEOS,
  fillTemplates,
} from "@/lib/templates";

/**
 * Semua fungsi data publik:
 * - Query di SERVER (browser tidak memuat seluruh katalog).
 * - Gagal anggun: error Supabase → array kosong, UI menampilkan empty/error
 *   state yang jujur (termasuk saat env belum dikonfigurasi).
 */

export async function isSupabaseReady(): Promise<boolean> {
  // Cukup cek env — TIDAK menyentuh cookies() agar halaman publik tetap
  // bisa di-cache static/ISR.
  return isSupabaseConfigured();
}

const FILE_WITH_GAME = "*, game:games(id, slug, title, cover_url, genre)";

export async function getFeaturedFiles(limit = 3): Promise<FileItem[]> {
  try {
    const supabase = createPublicClient();
    const { data: featured } = await supabase
      .from("featured_items")
      .select("file_id, position")
      .eq("section", "home_files")
      .not("file_id", "is", null)
      .order("position")
      .limit(limit);
    const ids = (featured ?? []).map((f) => f.file_id).filter(Boolean) as string[];
    if (ids.length === 0) return getLatestFiles(limit);
    const { data } = await supabase
      .from("files")
      .select(FILE_WITH_GAME)
      .in("id", ids)
      .eq("status", "published");
    const byId = new Map((data ?? []).map((f: FileItem) => [f.id, f]));
    return fillTemplates(
      ids.map((id) => byId.get(id)).filter(Boolean) as FileItem[],
      TEMPLATE_FILES,
      limit
    );
  } catch {
    return [];
  }
}

export async function getLatestFiles(limit = 6): Promise<FileItem[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("files")
      .select(FILE_WITH_GAME)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return fillTemplates((data ?? []) as FileItem[], TEMPLATE_FILES, limit);
  } catch {
    return [];
  }
}

export async function getPublishedGames(limit = 6): Promise<Game[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return fillTemplates((data ?? []) as Game[], TEMPLATE_GAMES, limit);
  } catch {
    return [];
  }
}

export interface VersionWithFile {
  id: string;
  version_label: string;
  released_at: string | null;
  status: string;
  file: { id: string; slug: string; title: string; category: string } | null;
}

export async function getRecentVersionUpdates(limit = 4): Promise<VersionWithFile[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("file_versions")
      .select("id, version_label, released_at, status, file:files(id, slug, title, category, status)")
      .eq("is_latest", true)
      .order("released_at", { ascending: false, nullsFirst: false })
      .limit(limit * 2);
    const rows = ((data ?? []) as unknown as VersionWithFile[]).filter(
      (v) => v.file && (v.file as { status?: string }).status === "published"
    );
    return rows.slice(0, limit);
  } catch {
    return [];
  }
}

export async function getFeaturedTutorials(limit = 3): Promise<Tutorial[]> {
  try {
    const supabase = createPublicClient();
    const { data: featured } = await supabase
      .from("featured_items")
      .select("tutorial_id, position")
      .eq("section", "home_tutorials")
      .not("tutorial_id", "is", null)
      .order("position")
      .limit(limit);
    const ids = (featured ?? []).map((f) => f.tutorial_id).filter(Boolean) as string[];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("tutorials")
        .select("*, game:games(id, slug, title)")
        .in("id", ids)
        .eq("status", "published");
      const byId = new Map((data ?? []).map((t: Tutorial) => [t.id, t]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as Tutorial[];
      if (ordered.length > 0) return fillTemplates(ordered, TEMPLATE_TUTORIALS, limit);
    }
    const { data } = await supabase
      .from("tutorials")
      .select("*, game:games(id, slug, title)")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return fillTemplates((data ?? []) as Tutorial[], TEMPLATE_TUTORIALS, limit);
  } catch {
    return [];
  }
}

export async function getLatestVideos(limit = 4): Promise<Video[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    return fillTemplates((data ?? []) as Video[], TEMPLATE_VIDEOS, limit);
  } catch {
    return [];
  }
}

export async function getRecentForumTopics(limit = 5): Promise<ForumTopic[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("forum_topics")
      .select("*, author:profiles!author_id(id, display_name, avatar_url)")
      .eq("hidden", false)
      .order("last_activity_at", { ascending: false })
      .limit(limit);
    return fillTemplates((data ?? []) as ForumTopic[], TEMPLATE_TOPICS, limit);
  } catch {
    return [];
  }
}
