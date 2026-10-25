import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ConfigMissingState } from "@/components/ui/states";
import { SmartImg } from "@/components/ui/smart-img";
import { isSupabaseReady } from "@/lib/data/home";
import { getVideoBySlug } from "@/lib/data/catalog";
import { createPublicClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { extractYouTubeId, youtubeThumbnail, youtubeWatchUrl } from "@/lib/youtube";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Mengaktifkan ISR untuk route dinamis ini (lihat docs Next: generateStaticParams
 * menyalakan ISR). Path yang belum ada di build dirender on-demand lalu di-cache.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("videos")
      .select("slug")
      .eq("status", "published")
      .limit(500);
    return (data ?? []).map((v: { slug: string }) => ({ slug: v.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video || video.status !== "published") return { title: "Video tidak ditemukan" };
  return {
    title: video.title,
    description: video.description ?? `Video: ${video.title}`,
    openGraph: {
      title: `${video.title} · DeepCrips Hub`,
      description: video.description ?? undefined,
    },
  };
}

export default async function VideoDetailPage({ params }: Props) {
  const { slug } = await params;
  const ready = await isSupabaseReady();
  const video = await getVideoBySlug(slug);

  if (!ready) {
    return (
      <Section>
        <ConfigMissingState feature="Halaman video" />
      </Section>
    );
  }
  if (!video || video.status !== "published") notFound();

  const ytId = extractYouTubeId(video.video_url);
  const watchUrl = youtubeWatchUrl(video.video_url) ?? video.video_url;
  const thumb = video.thumbnail_url ?? youtubeThumbnail(video.video_url);

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/videos" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Video
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl">
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-black">
          {ytId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}`}
              title={video.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : thumb ? (
            <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="group relative block aspect-video">
              <SmartImg src={thumb} alt="" className="absolute inset-0" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-brand-fg shadow-pop transition-transform group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6" aria-hidden>
                    <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                  </svg>
                </span>
              </span>
            </a>
          ) : (
            <div className="flex aspect-video items-center justify-center text-text-faint">
              Video tidak dapat dipratinjau
            </div>
          )}
        </div>

        <header className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{video.category}</Badge>
            {video.published_at && <span className="text-sm text-text-faint">{formatDate(video.published_at)}</span>}
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">{video.title}</h1>
          {video.description && <p className="mt-3 text-base text-text-muted">{video.description}</p>}
        </header>

        <div className="flex flex-wrap gap-3">
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants("primary", "md")}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            Tonton di YouTube
          </a>
          {video.game_id && (
            <Link href="/games" className={buttonVariants("outline", "md")}>
              Lihat game terkait
            </Link>
          )}
        </div>
      </article>
    </Section>
  );
}
