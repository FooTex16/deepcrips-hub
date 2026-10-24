import { createClient } from "@/lib/supabase/server";

export interface AdminOverview {
  games: number;
  files: number;
  publishedFiles: number;
  tutorials: number;
  videos: number;
  topics: number;
  openReports: number;
  pendingRequests: number;
  totalClicks: number;
  recentClicks7d: number;
  ready: boolean;
}

/**
 * Statistik ringkasan admin — semua lewat user-scoped client (RLS memberi
 * staff visibilitas penuh pada konten). Gagal = nol, tanpa data palsu.
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const empty: AdminOverview = {
    games: 0,
    files: 0,
    publishedFiles: 0,
    tutorials: 0,
    videos: 0,
    topics: 0,
    openReports: 0,
    pendingRequests: 0,
    totalClicks: 0,
    recentClicks7d: 0,
    ready: false,
  };
  try {
    const supabase = await createClient();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      games,
      files,
      publishedFiles,
      tutorials,
      videos,
      topics,
      openReports,
      pendingRequests,
      totalClicks,
      recentClicks,
    ] = await Promise.all([
      supabase.from("games").select("id", { count: "exact", head: true }),
      supabase.from("files").select("id", { count: "exact", head: true }),
      supabase.from("files").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("tutorials").select("id", { count: "exact", head: true }),
      supabase.from("videos").select("id", { count: "exact", head: true }),
      supabase.from("forum_topics").select("id", { count: "exact", head: true }),
      supabase.from("content_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("content_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("download_events").select("id", { count: "exact", head: true }),
      supabase.from("download_events").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    ]);

    return {
      games: games.count ?? 0,
      files: files.count ?? 0,
      publishedFiles: publishedFiles.count ?? 0,
      tutorials: tutorials.count ?? 0,
      videos: videos.count ?? 0,
      topics: topics.count ?? 0,
      openReports: openReports.count ?? 0,
      pendingRequests: pendingRequests.count ?? 0,
      totalClicks: totalClicks.count ?? 0,
      recentClicks7d: recentClicks.count ?? 0,
      ready: true,
    };
  } catch {
    return empty;
  }
}
