import Link from "next/link";
import type { Metadata } from "next";
import { Vote, SearchX, Plus, Inbox } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseReady } from "@/lib/data/home";
import { listRequests, listMyRequests } from "@/lib/data/requests";
import { REQUEST_STATUS_META } from "@/lib/types";
import { timeAgo, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Permintaan Konten",
  description:
    "Usulkan konten baru untuk DeepCrips Hub dan dukung permintaan anggota lain dengan satu suara.",
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();
  const user = await getAuthUser();

  const q = one(sp, "q").trim();
  const status = one(sp, "status");
  const sort = one(sp, "sort") === "latest" ? "latest" : "votes";
  const view = one(sp, "view");
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const isMyView = view === "mine" && Boolean(user);

  const [result, mine] = await Promise.all([
    isMyView
      ? Promise.resolve({ items: [], count: 0, page: 1, totalPages: 0 })
      : listRequests({
          q: q || undefined,
          status: status || undefined,
          sort,
          page,
        }),
    isMyView && user ? listMyRequests(user.id) : Promise.resolve([]),
  ]);

  const qs = (overrides: Record<string, string | undefined>) => {
    const merged = {
      q: q || undefined,
      status: status || undefined,
      sort: sort !== "votes" ? sort : undefined,
      view: isMyView ? "mine" : undefined,
      page: undefined,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/requests?${s}` : "/requests";
  };

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Permintaan Konten</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
            Usulkan konten baru dan dukung permintaan lain. Satu suara per anggota per permintaan.
          </p>
        </div>
        <Link
          href={user ? "/requests/new" : `/login?next=${encodeURIComponent("/requests/new")}`}
          className={buttonVariants("primary", "md")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Ajukan Permintaan
        </Link>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          action="/requests"
          placeholder="Cari permintaan…"
          defaultValue={q}
          className="max-w-md"
        />
        <nav aria-label="Tampilan & urutan" className="flex flex-wrap gap-1.5">
          {user && (
            <Link
              href={qs({ view: "mine", sort: undefined, status: undefined })}
              className={isMyView ? buttonVariants("primary", "sm") : buttonVariants("ghost", "sm")}
            >
              <Inbox className="mr-1 h-3.5 w-3.5" aria-hidden />
              Milik saya
            </Link>
          )}
          <Link
            href={qs({ view: undefined, sort: undefined })}
            className={!isMyView && sort === "votes" ? buttonVariants("primary", "sm") : buttonVariants("ghost", "sm")}
          >
            Paling didukung
          </Link>
          <Link
            href={qs({ view: undefined, sort: "latest" })}
            className={sort === "latest" ? buttonVariants("primary", "sm") : buttonVariants("ghost", "sm")}
          >
            Terbaru
          </Link>
        </nav>
      </div>

      {/* Filter status */}
      {!isMyView && (
        <nav aria-label="Filter status" className="mb-6 flex flex-wrap gap-1.5">
          <Link
            href={qs({ status: undefined })}
            className={
              !status
                ? "rounded-full border border-brand/50 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"
                : "rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text"
            }
          >
            Semua status
          </Link>
          {Object.entries(REQUEST_STATUS_META).map(([key, meta]) => (
            <Link
              key={key}
              href={qs({ status: key })}
              className={
                status === key
                  ? "rounded-full border border-brand/50 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand"
                  : "rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text"
              }
            >
              {meta.label}
            </Link>
          ))}
        </nav>
      )}

      {!ready ? (
        <ConfigMissingState feature="Permintaan konten" />
      ) : isMyView ? (
        mine.length > 0 ? (
          <ul className="space-y-3">
            {mine.map((req) => (
              <RequestRow key={req.id} req={req} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Anda belum mengajukan permintaan"
            description="Ajukan permintaan konten pertama Anda — admin akan meninjaunya."
            actionHref="/requests/new"
            actionLabel="Ajukan permintaan"
          />
        )
      ) : result.items.length > 0 ? (
        <>
          <ul className="space-y-3">
            {result.items.map((req) => (
              <RequestRow key={req.id} req={req} />
            ))}
          </ul>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/requests"
            searchParams={{ q, status, sort: sort !== "votes" ? sort : undefined }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={q ? <SearchX className="h-8 w-8" /> : <Vote className="h-8 w-8" />}
          title={q ? `Tidak ada permintaan untuk “${q}”` : "Belum ada permintaan"}
          description={
            q
              ? "Coba kata kunci lain."
              : "Jadilah yang pertama mengajukan permintaan konten untuk DeepCrips Hub."
          }
          actionHref={user ? "/requests/new" : `/login?next=${encodeURIComponent("/requests/new")}`}
          actionLabel={user ? "Ajukan permintaan" : "Masuk untuk mengajukan"}
        />
      )}

      <p className="mt-8 text-xs text-text-faint">
        Status permintaan hanya dapat diubah oleh admin. Mengajukan permintaan tidak menjamin konten akan
        dibuat.
      </p>
    </Section>
  );
}

function RequestRow({ req }: { req: import("@/lib/types").ContentRequest }) {
  const meta = REQUEST_STATUS_META[req.status];
  return (
    <li>
      <Link
        href={`/requests/${req.id}`}
        className="group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex min-w-[3.5rem] flex-col items-center rounded-xl border border-border bg-bg-subtle py-2">
          <Vote className="h-4 w-4 text-brand" aria-hidden />
          <span className="text-sm font-bold tabular-nums text-text">{req.vote_count}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-1 text-[15px] font-semibold text-text group-hover:text-brand">
            {req.title}
          </span>
          <span className="mt-1 line-clamp-2 block text-sm text-text-muted">
            {truncate(req.description, 160)}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-faint">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <Badge tone="neutral">{req.request_type}</Badge>
            {req.game && <Badge tone="info">{req.game.title}</Badge>}
            <span className="inline-flex items-center gap-1.5">
              <Avatar src={req.requester?.avatar_url} name={req.requester?.display_name ?? "?"} size="xs" />
              {req.requester?.display_name ?? "Anggota"}
            </span>
            <span>{timeAgo(req.created_at)}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}
