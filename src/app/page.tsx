import Link from "next/link";
import { Gamepad2, FileDown, Sparkles, ArrowRight, MessageSquare, Upload } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCard } from "@/components/content/file-card";
import { GameCard } from "@/components/content/game-card";
import { TutorialCard, VideoCard } from "@/components/content/media-cards";
import { TopicRow } from "@/components/content/topic-row";
import { Reveal } from "@/components/motion/reveal";
import { AmbientBackground } from "@/components/motion/ambient-bg";
import { ScrambleTitle } from "@/components/motion/scramble-title";
import { formatDate } from "@/lib/utils";
import { fileCategoryLabel } from "@/lib/types";
import { templatesEnabled } from "@/lib/data/settings";
import {
  TEMPLATE_GAMES,
  TEMPLATE_FILES,
  TEMPLATE_TUTORIALS,
  TEMPLATE_VIDEOS,
} from "@/lib/templates";
import {
  isSupabaseReady,
  getFeaturedFiles,
  getLatestFiles,
  getPublishedGames,
  getRecentVersionUpdates,
  getFeaturedTutorials,
  getLatestVideos,
  getRecentForumTopics,
} from "@/lib/data/home";

export const revalidate = 60;

export default async function HomePage() {
  const ready = await isSupabaseReady();

  const [featuredFiles, latestFiles, games, versionUpdates, tutorials, videos, topics, templatesOn] =
    await Promise.all([
      getFeaturedFiles(3),
      getLatestFiles(6),
      getPublishedGames(6),
      getRecentVersionUpdates(4),
      getFeaturedTutorials(3),
      getLatestVideos(4),
      getRecentForumTopics(5),
      templatesEnabled(),
    ]);

  // Kata kunci animasi placeholder pencarian: judul konten template bila
  // toggle template aktif, judul konten asli bila mati — otomatis menyesuaikan.
  const sourceTitles = templatesOn
    ? [...TEMPLATE_GAMES, ...TEMPLATE_FILES, ...TEMPLATE_TUTORIALS, ...TEMPLATE_VIDEOS].map(
        (t) => t.title
      )
    : [...games, ...latestFiles, ...tutorials, ...videos].map((t) => t.title);
  const searchKeywords = [...new Set(sourceTitles)]
    .map((t) => (t.length > 36 ? `${t.slice(0, 35).trimEnd()}…` : t))
    .slice(0, 8);

  return (
    <>
      {/* ===== Hero ===== */}
      <section className="relative isolate overflow-hidden border-b border-border">
        {/* Latar gradien bergerak loop */}
        <AmbientBackground />
        <div aria-hidden className="absolute inset-0 bg-grid-fade opacity-60" />
        <div
          aria-hidden
          className="absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
        />
        <div className="container relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <Badge tone="brand" className="mb-5" icon={<Sparkles className="h-3 w-3" aria-hidden />}>
                Platform Konten DeepCrips
              </Badge>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl lg:text-6xl">
                <ScrambleTitle
                  segments={[
                    { text: "Pusat " },
                    { text: "Game, Download", className: "text-gradient-brand", brAfter: true },
                    { text: " & Konten Teknologi" },
                  ]}
                />
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
                Jelajahi katalog file, tutorial, dan video terbaru dari <strong className="text-text">@DeepCrips</strong> —
                semuanya dalam satu hub yang cepat dan terorganisir.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mx-auto mt-8 max-w-xl">
                <SearchInput
                  action="/search"
                  placeholder="Cari game, file, tutorial, video…"
                  typingPlaceholder={searchKeywords}
                  className="shadow-pop"
                />
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/games" className={buttonVariants("primary", "lg")}>
                  <Gamepad2 className="h-5 w-5" aria-hidden />
                  Jelajahi Game
                </Link>
                <Link href="/downloads" className={buttonVariants("outline", "lg")}>
                  <FileDown className="h-5 w-5" aria-hidden />
                  Katalog Download
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {!ready && (
        <Section className="pt-8">
          <ConfigMissingState feature="Konten katalog" />
        </Section>
      )}

      {/* ===== File unggulan ===== */}
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow="Pilihan Editor"
            title="File Unggulan"
            description="File pilihan yang ditampilkan di beranda — diatur oleh admin."
            actionHref="/downloads"
            actionLabel="Semua file"
          />
        </Reveal>
        {featuredFiles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredFiles.map((file, i) => (
              <Reveal key={file.id} delay={i * 50}>
                <FileCard file={file} />
              </Reveal>
            ))}
          </div>
        ) : ready ? (
          <EmptyState
            title="Belum ada file unggulan"
            description="Admin dapat menandai file sebagai unggulan melalui dashboard. Sementara itu, lihat file terbaru di halaman download."
            actionHref="/downloads"
            actionLabel="Lihat file terbaru"
          />
        ) : null}
      </Section>

      {/* ===== Eksplorasi game ===== */}
      <Section className="border-y border-border bg-bg-subtle">
        <Reveal>
          <SectionHeader
            eyebrow="Katalog"
            title="Eksplorasi Game"
            description="Semua konten terorganisir per game — download, tutorial, dan video terkait."
            actionHref="/games"
            actionLabel="Semua game"
          />
        </Reveal>
        {games.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game, i) => (
              <Reveal key={game.id} delay={i * 40}>
                <GameCard game={game} />
              </Reveal>
            ))}
          </div>
        ) : ready ? (
          <EmptyState
            title="Belum ada game terbit"
            description="Katalog game akan muncul setelah admin menerbitkan game pertama."
          />
        ) : null}
      </Section>

      {/* ===== Download terbaru + pembaruan versi ===== */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Reveal>
              <SectionHeader
                eyebrow="Terbaru"
                title="Download Terbaru"
                actionHref="/downloads"
                actionLabel="Semua download"
              />
            </Reveal>
            {latestFiles.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {latestFiles.slice(0, 4).map((file, i) => (
                  <Reveal key={file.id} delay={i * 40}>
                    <FileCard file={file} />
                  </Reveal>
                ))}
              </div>
            ) : ready ? (
              <EmptyState title="Belum ada file terbit" description="File baru akan tampil di sini setelah diterbitkan." />
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <Reveal>
              <SectionHeader eyebrow="Riwayat" title="Pembaruan Versi" />
            </Reveal>
            <Reveal delay={60}>
              <ul className="space-y-3">
                {versionUpdates.length > 0 ? (
                  versionUpdates.map((v) => (
                    <li key={v.id}>
                      <Link
                        href={`/downloads/${v.file!.slug}`}
                        className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-all hover:border-brand/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                          <FileDown className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-1 text-sm font-semibold text-text group-hover:text-brand">
                            {v.file!.title}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-faint">
                            <Badge tone="neutral">v{v.version_label}</Badge>
                            <span>{fileCategoryLabel(v.file!.category)}</span>
                            {v.released_at && <span>{formatDate(v.released_at)}</span>}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))
                ) : ready ? (
                  <li>
                    <EmptyState title="Belum ada pembaruan" description="Riwayat versi terbaru akan tampil di sini." />
                  </li>
                ) : null}
              </ul>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ===== Tutorial pilihan ===== */}
      {tutorials.length > 0 && (
        <Section className="border-y border-border bg-bg-subtle">
          <Reveal>
            <SectionHeader
              eyebrow="Belajar"
              title="Tutorial Pilihan"
              actionHref="/tutorials"
              actionLabel="Semua tutorial"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutorials.map((tutorial, i) => (
              <Reveal key={tutorial.id} delay={i * 50}>
                <TutorialCard tutorial={tutorial} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Video YouTube ===== */}
      {videos.length > 0 && (
        <Section>
          <Reveal>
            <SectionHeader
              eyebrow="YouTube"
              title="Video Terbaru"
              description="Kanal YouTube @DeepCrips — thumbnail ringan, klik untuk menonton."
              actionHref="/videos"
              actionLabel="Semua video"
            />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {videos.map((video, i) => (
              <Reveal key={video.id} delay={i * 50}>
                <VideoCard video={video} />
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ===== Diskusi forum ===== */}
      <Section className="border-t border-border bg-bg-subtle">
        <Reveal>
          <SectionHeader
            eyebrow="Komunitas"
            title="Diskusi Terbaru"
            description="Tanya, bagikan, dan berdiskusi dengan anggota lain."
            actionHref="/forum"
            actionLabel="Buka forum"
          />
        </Reveal>
        <Reveal delay={60}>
          <div className="space-y-3">
            {topics.length > 0 ? (
              topics.map((topic) => <TopicRow key={topic.id} topic={topic} />)
            ) : ready ? (
              <EmptyState
                title="Belum ada diskusi"
                description="Jadilah anggota pertama yang memulai diskusi di forum."
                actionHref="/forum"
                actionLabel="Buka forum"
              />
            ) : null}
          </div>
        </Reveal>

        {/* CTA komunitas */}
        <Reveal delay={100}>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/forum"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <MessageSquare className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-text">Ikut Berdiskusi</span>
                <span className="text-sm text-text-muted">Buat topik atau balas thread di forum.</span>
              </span>
              <ArrowRight className="ml-auto h-5 w-5 text-text-faint transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/requests"
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Upload className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-text">Ajukan Permintaan</span>
                <span className="text-sm text-text-muted">Usulkan konten baru dan dukung permintaan lain.</span>
              </span>
              <ArrowRight className="ml-auto h-5 w-5 text-text-faint transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
