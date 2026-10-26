import Link from "next/link";
import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { FileCard } from "@/components/content/file-card";
import { DownloadFilters } from "@/components/catalog/download-filters";
import { isSupabaseReady } from "@/lib/data/home";
import { listPublishedFiles, listPublishedGames } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Download",
  description:
    "Jelajahi file unduhan DeepCrips — filter berdasarkan game, jenis file, tanggal pembaruan, dan ketersediaan.",
  openGraph: { title: "Katalog Download · DeepCrips Hub" },
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function DownloadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();

  const q = one(sp, "q").trim();
  const game = one(sp, "game");
  const category = one(sp, "category");
  const updatedWithinRaw = one(sp, "updated");
  const availability = one(sp, "availability");
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const updatedWithin =
    updatedWithinRaw === "7d" || updatedWithinRaw === "30d" || updatedWithinRaw === "90d"
      ? updatedWithinRaw
      : undefined;

  const [result, games] = await Promise.all([
    listPublishedFiles({
      q: q || undefined,
      game: game || undefined,
      category: category || undefined,
      updatedWithin,
      availability: availability === "available" ? "available" : undefined,
      page,
    }),
    listPublishedGames({ page: 1 }),
  ]);

  const hasFilters = Boolean(q || game || category || updatedWithin || availability);

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Katalog Download</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          File unduhan dikelola admin. Login diperlukan saat mengunduh; setiap versi dapat memiliki beberapa host
          alternatif.
        </p>
      </header>

      <DownloadFilters
        values={{
          q,
          game,
          category,
          updated: updatedWithin ?? "",
          availability,
          gameOptions: games.items.map((g) => ({ value: g.slug, label: g.title })),
          total: result.count,
        }}
      />

      {!ready ? (
        <ConfigMissingState feature="Katalog download" />
      ) : result.items.length > 0 ? (
        <>
          <div className="dc-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/downloads"
            searchParams={{ q, game, category, updated: updatedWithin, availability }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={<SearchX className="h-8 w-8" />}
          title={hasFilters ? "Tidak ada file yang cocok" : "Belum ada file terbit"}
          description={
            hasFilters
              ? "Coba longgarkan filter atau gunakan kata kunci lain."
              : "Katalog akan terisi setelah admin menerbitkan file."
          }
          {...(hasFilters ? { actionHref: "/downloads", actionLabel: "Reset filter" } : {})}
        />
      )}

      <p className="mt-8 text-xs text-text-faint">
        Ingin usulkan konten baru? Lihat{" "}
        <Link href="/requests" className="text-brand hover:underline">
          halaman permintaan konten
        </Link>
        .
      </p>
    </Section>
  );
}
