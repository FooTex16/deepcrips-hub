import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import type { Tutorial, Video } from "@/lib/types";import { cn, formatDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { youtubeThumbnail } from "@/lib/youtube";

/** Kartu tutorial. */
export function TutorialCard({ tutorial, className }: { tutorial: Tutorial; className?: string }) {
  return (
    <Link
      href={`/tutorials/${tutorial.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {tutorial.cover_url ? (
          <Image
            src={tutorial.cover_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-text-faint" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          {tutorial.is_template && <Badge tone="neutral">Contoh</Badge>}
          <Badge tone="neutral">{tutorial.category}</Badge>
          {tutorial.game && <Badge tone="info">{tutorial.game.title}</Badge>}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text transition-colors group-hover:text-brand">
          {tutorial.title}
        </h3>
        {tutorial.summary && <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{truncate(tutorial.summary, 110)}</p>}
        {tutorial.published_at && (
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-text-faint">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {formatDate(tutorial.published_at)}
          </p>
        )}
      </div>
    </Link>
  );
}

/** Kartu video YouTube — thumbnail statis, tautan keluar (tanpa iframe). */
export function VideoCard({ video, className }: { video: Video; className?: string }) {
  const thumb = youtubeThumbnail(video.thumbnail_url ?? video.video_url) ?? youtubeThumbnail(video.video_url);
  return (
    <Link
      href={`/videos/${video.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-surface-2">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-faint">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </div>
        )}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-brand-fg shadow-pop">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
        </span>
        {video.is_template && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
            Contoh
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text transition-colors group-hover:text-brand">
          {video.title}
        </h3>
        <p className="mt-auto pt-3 text-xs text-text-faint">
          {video.category} {video.published_at ? `· ${formatDate(video.published_at)}` : ""}
        </p>
      </div>
    </Link>
  );
}
