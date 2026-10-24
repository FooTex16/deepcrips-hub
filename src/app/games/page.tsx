import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { GameCard } from "@/components/content/game-card";
import { isSupabaseReady } from "@/lib/data/home";
import { listPublishedGames, getGameGenres } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Game",
  description: "Semua game di DeepCrips Hub — download, tutorial, dan video terkait dalam satu tempat.",
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function GamesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();

  const q = one(sp, "q").trim();
  const genre = one(sp, "genre");
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const [result, genres] = await Promise.all([
    listPublishedGames({ q: q || undefined, genre: genre || undefined, page }),
    getGameGenres(),
  ]);

  const hasFilters = Boolean(q || genre);

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Katalog Game</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Semua konten — download, tutorial, dan video — terorganisir per game.
        </p>
      </header>

      <form method="get" action="/games" className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="sr-only">
              Cari game
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari game…"
              className="h-10 w-full rounded-xl border border-border bg-bg-subtle px-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <div>
            <label htmlFor="genre" className="sr-only">
              Genre
            </label>
            <select
              id="genre"
              name="genre"
              defaultValue={genre}
              className="h-10 w-full cursor-pointer rounded-xl border border-border bg-bg-subtle px-3.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            >
              <option value="">Semua genre</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-brand text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
          >
            Terapkan
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-text-faint">{result.count} game</p>
          {hasFilters && (
            <Link href="/games" className="text-xs font-semibold text-brand hover:underline">
              Reset filter
            </Link>
          )}
        </div>
      </form>

      {!ready ? (
        <ConfigMissingState feature="Katalog game" />
      ) : result.items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/games"
            searchParams={{ q, genre }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={<SearchX className="h-8 w-8" />}
          title={hasFilters ? "Tidak ada game yang cocok" : "Belum ada game terbit"}
          description={hasFilters ? "Coba kata kunci atau genre lain." : "Game akan tampil setelah diterbitkan admin."}
          {...(hasFilters ? { actionHref: "/games", actionLabel: "Reset filter" } : {})}
        />
      )}
    </Section>
  );
}
