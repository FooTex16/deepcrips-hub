import Link from "next/link";
import type { Metadata } from "next";
import { SearchX, Gamepad2, FileDown, BookOpen, Video as VideoIcon, Lightbulb } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { searchContent } from "@/lib/data/search";
import { truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pencarian",
  description: "Cari game, file, tutorial, dan video di DeepCrips Hub.",
  robots: { index: false },
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

const SOURCE_META = {
  game: { label: "Game", icon: <Gamepad2 className="h-3.5 w-3.5" aria-hidden />, tone: "info" as const },
  file: { label: "File", icon: <FileDown className="h-3.5 w-3.5" aria-hidden />, tone: "brand" as const },
  tutorial: { label: "Tutorial", icon: <BookOpen className="h-3.5 w-3.5" aria-hidden />, tone: "success" as const },
  video: { label: "Video", icon: <VideoIcon className="h-3.5 w-3.5" aria-hidden />, tone: "warning" as const },
};

const TYPE_TABS = [
  { id: "all", label: "Semua" },
  { id: "game", label: "Game" },
  { id: "file", label: "File" },
  { id: "tutorial", label: "Tutorial" },
  { id: "video", label: "Video" },
];

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = one(sp, "q").trim();
  const type = one(sp, "type") || "all";
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const outcome = await searchContent(q, page, type);

  const qs = (overrides: Record<string, string | undefined>) => {
    const merged = { q: q || undefined, type: type !== "all" ? type : undefined, page: undefined, ...overrides };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/search?${s}` : "/search";
  };

  const grouped = {
    game: outcome.results.filter((r) => r.source === "game"),
    file: outcome.results.filter((r) => r.source === "file"),
    tutorial: outcome.results.filter((r) => r.source === "tutorial"),
    video: outcome.results.filter((r) => r.source === "video"),
  };

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Pencarian</h1>
        <p className="mt-1.5 text-sm text-text-muted">Cari di seluruh konten: game, file, tutorial, dan video.</p>
      </header>

      <SearchInput action="/search" defaultValue={q} autoFocus className="mb-4 max-w-2xl" />

      {/* Tab filter tipe konten */}
      <nav aria-label="Filter hasil" className="mb-6 flex flex-wrap gap-1.5">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.id}
            href={qs({ type: tab.id === "all" ? undefined : tab.id })}
            aria-current={type === tab.id ? "page" : undefined}
            className={
              type === tab.id
                ? buttonVariants("primary", "sm")
                : buttonVariants("ghost", "sm")
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {outcome.error === "unconfigured" ? (
        <EmptyState
          title="Pencarian belum tersedia"
          description="Environment Supabase belum dikonfigurasi pada deployment ini."
        />
      ) : q.length < 2 ? (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8" />}
          title="Masukkan kata kunci"
          description="Ketik minimal 2 karakter untuk mulai mencari. Contoh: “script”, “config”, nama game, atau judul tutorial."
        />
      ) : outcome.results.length === 0 ? (
        <div className="space-y-6">
          <EmptyState
            icon={<SearchX className="h-8 w-8" />}
            title={`Tidak ada hasil untuk “${q}”`}
            description="Periksa ejaan atau coba kata kunci yang lebih umum."
          />
          {outcome.suggestions && outcome.suggestions.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <Lightbulb className="h-4 w-4 text-brand" aria-hidden />
                Saran kata kunci
              </p>
              <div className="flex flex-wrap gap-2">
                {outcome.suggestions.map((s) => (
                  <Link key={s} href={qs({ q: s, type: undefined })} className={buttonVariants("outline", "sm")}>
                    {s}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-xs text-text-faint">
                Saran bersifat umum dan <strong>bukan hasil yang cocok</strong> dengan pencarian Anda.
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-text-muted">
            <strong className="text-text">{outcome.total}</strong> hasil untuk “{q}”
            {type !== "all" && <> pada kategori {SOURCE_META[type as keyof typeof SOURCE_META]?.label}</>}
          </p>

          <div className="space-y-8">
            {(["game", "file", "tutorial", "video"] as const).map((source) => {
              const items = grouped[source];
              if (items.length === 0) return null;
              const meta = SOURCE_META[source];
              return (
                <section key={source} aria-labelledby={`group-${source}`}>
                  <h2 id={`group-${source}`} className="mb-3 flex items-center gap-2 text-base font-semibold text-text">
                    <Badge tone={meta.tone} icon={meta.icon}>
                      {meta.label}
                    </Badge>
                    <span className="text-sm font-normal text-text-faint">{items.length} hasil</span>
                  </h2>
                  <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                    {items.map((result) => (
                      <li key={`${result.source}-${result.id}`}>
                        <Link
                          href={result.url}
                          className="group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                        >
                          <span className="mt-0.5 text-text-faint">{meta.icon}</span>
                          <span className="min-w-0">
                            <span className="line-clamp-1 text-sm font-semibold text-text group-hover:text-brand">
                              {result.title}
                            </span>
                            {result.subtitle && (
                              <span className="mt-0.5 block line-clamp-1 text-xs text-text-muted">
                                {truncate(result.subtitle, 140)}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <Pagination
            page={outcome.page}
            totalPages={outcome.totalPages}
            basePath="/search"
            searchParams={{ q, type: type !== "all" ? type : undefined }}
            className="mt-8"
          />
        </>
      )}
    </Section>
  );
}
