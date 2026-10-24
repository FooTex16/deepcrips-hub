import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { FileCard } from "@/components/content/file-card";
import { TutorialCard, VideoCard } from "@/components/content/media-cards";
import { SmartImg } from "@/components/ui/smart-img";
import { isSupabaseReady } from "@/lib/data/home";
import { getGameBySlug, getGameContent } from "@/lib/data/catalog";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game || game.status !== "published") return { title: "Game tidak ditemukan" };
  return {
    title: game.title,
    description: game.summary ?? `Konten ${game.title} di DeepCrips Hub.`,
  };
}

export default async function GameDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const ready = await isSupabaseReady();
  const game = await getGameBySlug(slug);

  if (!ready) {
    return (
      <Section>
        <h1 className="mb-6 text-2xl font-bold text-text">Detail Game</h1>
        <ConfigMissingState feature="Halaman game" />
      </Section>
    );
  }
  if (!game || game.status !== "published") notFound();

  const content = await getGameContent(slug);
  const activeTab = ["download", "tutorial", "video"].includes(tab ?? "") ? (tab as string) : "semua";

  const tabs = [
    { label: "Semua", href: `/games/${slug}`, active: activeTab === "semua" },
    {
      label: "Download",
      href: `/games/${slug}?tab=download`,
      active: activeTab === "download",
      count: content.files.length,
    },
    {
      label: "Tutorial",
      href: `/games/${slug}?tab=tutorial`,
      active: activeTab === "tutorial",
      count: content.tutorials.length,
    },
    {
      label: "Video",
      href: `/games/${slug}?tab=video`,
      active: activeTab === "video",
      count: content.videos.length,
    },
  ];

  const showFiles = activeTab === "semua" || activeTab === "download";
  const showTutorials = activeTab === "semua" || activeTab === "tutorial";
  const showVideos = activeTab === "semua" || activeTab === "video";

  const totalContent = content.files.length + content.tutorials.length + content.videos.length;

  return (
    <>
      {/* Header game */}
      <div className="relative border-b border-border">
        <div className="absolute inset-0 overflow-hidden">
          {game.cover_url ? (
            <SmartImg
              src={game.cover_url}
              className="h-full w-full opacity-20 blur-xl"
              fallback={<span className="block h-full w-full bg-gradient-to-br from-brand-soft to-bg" />}
            />
          ) : (
            <div aria-hidden className="h-full w-full bg-gradient-to-br from-brand-soft to-bg" />
          )}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
        </div>
        <Section className="relative pt-10 pb-8">
          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/games" className="hover:text-text">
                  Game
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-text" aria-current="page">
                {game.title}
              </li>
            </ol>
          </nav>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {game.cover_url && (
              <SmartImg
                src={game.cover_url}
                alt={`Cover ${game.title}`}
                className="aspect-[3/4] w-40 shrink-0 rounded-2xl border border-border shadow-pop"
              />
            )}
            <div>
              {game.genre && (
                <span className="mb-2 inline-block rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
                  {game.genre}
                </span>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">{game.title}</h1>
              {game.summary && <p className="mt-2 max-w-2xl text-base text-text-muted">{game.summary}</p>}
              {game.published_at && (
                <p className="mt-2 text-sm text-text-faint">Diterbitkan {formatDate(game.published_at)}</p>
              )}
            </div>
          </div>
        </Section>
      </div>

      <Section>
        {/* Tab navigasi */}
        <Tabs items={tabs} className="mb-8" />

        {game.description && activeTab === "semua" && (
          <div className="prose-dc mb-8 whitespace-pre-wrap">{truncate(game.description, 500)}</div>
        )}

        {totalContent === 0 ? (
          <EmptyState
            title="Belum ada konten untuk game ini"
            description="Konten akan muncul setelah admin menerbitkan download, tutorial, atau video terkait."
          />
        ) : (
          <div className="space-y-10">
            {showFiles && content.files.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text">Download</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {content.files.map((file) => (
                    <FileCard key={file.id} file={file} />
                  ))}
                </div>
              </div>
            )}

            {showTutorials && content.tutorials.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text">Tutorial</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {content.tutorials.map((tutorial) => (
                    <TutorialCard key={tutorial.id} tutorial={tutorial} />
                  ))}
                </div>
              </div>
            )}

            {showVideos && content.videos.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-text">Video</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {content.videos.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
}
