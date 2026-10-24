import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquare, SearchX, Plus } from "lucide-react";
import { Section } from "@/components/layout/section";
import { SearchInput } from "@/components/ui/search-input";
import { buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { TopicRow } from "@/components/content/topic-row";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseReady } from "@/lib/data/home";
import { listTopics } from "@/lib/data/forum";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forum Komunitas",
  description: "Diskusi komunitas DeepCrips — tanya, bagikan, dan berbagi pengalaman.",
};

type SP = Record<string, string | string[] | undefined>;

function one(sp: SP, key: string): string {
  const v = sp[key];
  return typeof v === "string" ? v : "";
}

export default async function ForumPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const ready = await isSupabaseReady();
  const user = await getAuthUser();

  const q = one(sp, "q").trim();
  const sort = one(sp, "sort") === "popular" ? "popular" : "latest";
  const page = Math.max(1, Number(one(sp, "page")) || 1);

  const result = await listTopics({ q: q || undefined, sort, page });

  const qs = (overrides: Record<string, string | undefined>) => {
    const merged = {
      q: q || undefined,
      sort: sort !== "latest" ? sort : undefined,
      page: undefined,
      ...overrides,
    };
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/forum?${s}` : "/forum";
  };

  return (
    <Section className="pt-8 sm:pt-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Forum Komunitas</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
            Diskusi asinkron — bukan live chat. Hormati anggota lain dan ikuti aturan komunitas.
          </p>
        </div>
        <Link href={user ? "/forum/new" : `/login?next=${encodeURIComponent("/forum/new")}`} className={buttonVariants("primary", "md")}>
          <Plus className="h-4 w-4" aria-hidden />
          Buat Topik
        </Link>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput action="/forum" placeholder="Cari judul atau isi topik…" defaultValue={q} className="max-w-md" />
        <nav aria-label="Urutkan" className="flex gap-1.5">
          <Link href={qs({ sort: undefined })} className={sort === "latest" ? buttonVariants("primary", "sm") : buttonVariants("ghost", "sm")}>
            Terbaru
          </Link>
          <Link href={qs({ sort: "popular" })} className={sort === "popular" ? buttonVariants("primary", "sm") : buttonVariants("ghost", "sm")}>
            Populer
          </Link>
        </nav>
      </div>

      {!ready ? (
        <ConfigMissingState feature="Forum" />
      ) : result.items.length > 0 ? (
        <>
          <div className="space-y-3">
            {result.items.map((topic) => (
              <TopicRow key={topic.id} topic={topic} />
            ))}
          </div>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath="/forum"
            searchParams={{ q, sort: sort !== "latest" ? sort : undefined }}
            className="mt-8"
          />
        </>
      ) : (
        <EmptyState
          icon={q ? <SearchX className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
          title={q ? `Tidak ada topik untuk “${q}”` : "Belum ada topik"}
          description={
            q ? "Coba kata kunci lain." : "Jadilah anggota pertama yang memulai diskusi di forum."
          }
          actionHref={user ? "/forum/new" : `/login?next=${encodeURIComponent("/forum/new")}`}
          actionLabel={user ? "Buat topik pertama" : "Masuk untuk membuat topik"}
        />
      )}

      <p className="mt-8 text-xs text-text-faint">
        Kanal komunitas eksternal (Discord/Telegram) tersedia di footer bila dikonfigurasi admin.
      </p>
    </Section>
  );
}
