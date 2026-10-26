import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, BookOpen } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { TutorialCard } from "@/components/content/media-cards";
import { isSupabaseReady } from "@/lib/data/home";
import { listPublishedTutorials } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tutorial",
  description: "Tutorial gaming dan teknologi dari DeepCrips — panduan langkah demi langkah.",
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function TutorialsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();
  const q = one(sp, "q").trim();
  const category = one(sp, "category");
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const result = await listPublishedTutorials({ q: q || undefined, category: category || undefined, page });

  const categories = Array.from(new Set(result.items.map((t) => t.category).filter(Boolean)));
  const hasFilters = Boolean(q || category);

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Tutorial</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Panduan dan cara penggunaan konten DeepCrips — langkah demi langkah.
        </p>
      </header>

      <form method="get" action="/tutorials" className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="q" className="sr-only">
              Cari tutorial
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari tutorial…"
              className="h-10 w-full rounded-xl border border-border bg-bg-subtle px-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <div>
            <label htmlFor="category" className="sr-only">
              Kategori
            </label>
            <select
              id="category"
              name="category"
              defaultValue={category}
              className="h-10 w-full cursor-pointer rounded-xl border border-border bg-bg-subtle px-3.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            >
              <option value="">Semua kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
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
          <p className="text-xs text-text-faint">{result.count} tutorial</p>
          {hasFilters && (
            <Link href="/tutorials" className="text-xs font-semibold text-brand hover:underline">
              Reset filter
            </Link>
          )}
        </div>
      </form>

      {!ready ? (
        <ConfigMissingState feature="Katalog tutorial" />
      ) : result.items.length > 0 ? (
        <>
          <div className="dc-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/tutorials"
            searchParams={{ q, category }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={hasFilters ? <SearchX className="h-8 w-8" /> : <BookOpen className="h-8 w-8" />}
          title={hasFilters ? "Tidak ada tutorial yang cocok" : "Belum ada tutorial"}
          description={hasFilters ? "Coba kata kunci lain." : "Tutorial akan tampil setelah diterbitkan admin."}
          {...(hasFilters ? { actionHref: "/tutorials", actionLabel: "Reset filter" } : {})}
        />
      )}
    </Section>
  );
}
