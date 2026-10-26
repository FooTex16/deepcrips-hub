import type { Metadata } from "next";
import { SearchX, Video } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { VideoCard } from "@/components/content/media-cards";
import { isSupabaseReady } from "@/lib/data/home";
import { listPublishedVideos } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video YouTube",
  description: "Video terbaru dari kanal YouTube @DeepCrips — tutorial, gameplay, dan konten teknologi.",
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function VideosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();
  const q = one(sp, "q").trim();
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const result = await listPublishedVideos({ q: q || undefined, page });
  const hasFilter = Boolean(q);

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Video YouTube</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Kanal <strong className="text-text">@DeepCrips</strong> — thumbnail ringan, klik untuk menonton langsung di
          YouTube.
        </p>
      </header>

      <form method="get" action="/videos" className="mb-6 flex max-w-md gap-2">
        <div className="flex-1">
          <label htmlFor="q" className="sr-only">
            Cari video
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Cari video…"
            className="h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          Cari
        </button>
      </form>

      {!ready ? (
        <ConfigMissingState feature="Katalog video" />
      ) : result.items.length > 0 ? (
        <>
          <div className="dc-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/videos"
            searchParams={{ q }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={hasFilter ? <SearchX className="h-8 w-8" /> : <Video className="h-8 w-8" />}
          title={hasFilter ? "Tidak ada video yang cocok" : "Belum ada video"}
          description={hasFilter ? "Coba kata kunci lain." : "Video akan tampil setelah ditambahkan admin."}
          {...(hasFilter ? { actionHref: "/videos", actionLabel: "Reset pencarian" } : {})}
        />
      )}

      <p className="mt-8 text-xs text-text-faint">
        Video dikelola manual oleh admin. Kami tidak melakukan sinkronisasi otomatis dengan YouTube API.
      </p>
    </Section>
  );
}
