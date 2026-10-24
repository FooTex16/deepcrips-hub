import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Sitemap dinamis — hanya menyertakan konten published. Bila Supabase belum
 * dikonfigurasi, hanya halaman statis yang disertakan.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/games`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/downloads`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tutorials`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/videos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/forum`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/requests`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/policies`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/security`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [games, files, tutorials, videos] = await Promise.all([
      supabase.from("games").select("slug, updated_at").eq("status", "published").limit(5000),
      supabase.from("files").select("slug, updated_at").eq("status", "published").limit(5000),
      supabase.from("tutorials").select("slug, updated_at").eq("status", "published").limit(5000),
      supabase.from("videos").select("slug, updated_at").eq("status", "published").limit(5000),
    ]);

    const toEntries = (
      rows: { slug: string; updated_at: string | null }[],
      basePath: string,
      priority: number,
      changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    ): MetadataRoute.Sitemap =>
      rows.map((r) => ({
        url: `${SITE_URL}${basePath}/${r.slug}`,
        lastModified: r.updated_at ? new Date(r.updated_at) : undefined,
        changeFrequency,
        priority,
      }));

    return [
      ...staticRoutes,
      ...toEntries((games.data ?? []) as Array<{ slug: string; updated_at: string | null }>, "/games", 0.8, "weekly"),
      ...toEntries((files.data ?? []) as Array<{ slug: string; updated_at: string | null }>, "/downloads", 0.8, "weekly"),
      ...toEntries((tutorials.data ?? []) as Array<{ slug: string; updated_at: string | null }>, "/tutorials", 0.6, "monthly"),
      ...toEntries((videos.data ?? []) as Array<{ slug: string; updated_at: string | null }>, "/videos", 0.6, "monthly"),
    ];
  } catch {
    // Supabase belum dikonfigurasi — kembalikan hanya rute statis.
    return staticRoutes;
  }
}
