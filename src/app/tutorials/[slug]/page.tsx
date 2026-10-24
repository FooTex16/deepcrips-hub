import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { ConfigMissingState } from "@/components/ui/states";
import { SmartImg } from "@/components/ui/smart-img";
import { isSupabaseReady } from "@/lib/data/home";
import { getTutorialBySlug } from "@/lib/data/catalog";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await getTutorialBySlug(slug);
  if (!tutorial || tutorial.status !== "published") return { title: "Tutorial tidak ditemukan" };
  return {
    title: tutorial.title,
    description: tutorial.summary ?? `Tutorial: ${tutorial.title}`,
  };
}

export default async function TutorialDetailPage({ params }: Props) {
  const { slug } = await params;
  const ready = await isSupabaseReady();
  const tutorial = await getTutorialBySlug(slug);

  if (!ready) {
    return (
      <Section>
        <ConfigMissingState feature="Halaman tutorial" />
      </Section>
    );
  }
  if (!tutorial || tutorial.status !== "published") notFound();

  const html = renderMarkdown(tutorial.body);

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/tutorials" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Tutorial
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{tutorial.category}</Badge>
            {tutorial.game && (
              <Link href={`/games/${tutorial.game.slug}`}>
                <Badge tone="info" icon={<Gamepad2 className="h-3 w-3" aria-hidden />}>
                  {tutorial.game.title}
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">
            {tutorial.title}
          </h1>
          {tutorial.summary && <p className="mt-3 text-base text-text-muted">{tutorial.summary}</p>}
          {tutorial.published_at && (
            <p className="mt-3 text-sm text-text-faint">{formatDate(tutorial.published_at)}</p>
          )}
        </header>

        {tutorial.cover_url && (
          <SmartImg
            src={tutorial.cover_url}
            alt=""
            className="mb-8 aspect-video rounded-2xl border border-border"
          />
        )}

        <div className="prose-dc" dangerouslySetInnerHTML={{ __html: html }} />

        <footer className="mt-12 rounded-2xl border border-border bg-surface p-5 text-sm text-text-muted">
          Tutorial ini bagian dari <Link href="/tutorials" className="text-brand hover:underline">katalog tutorial</Link>{" "}
          DeepCrips Hub. Butuh bantuan? Tanya di{" "}
          <Link href="/forum" className="text-brand hover:underline">
            forum komunitas
          </Link>
          .
        </footer>
      </article>
    </Section>
  );
}
