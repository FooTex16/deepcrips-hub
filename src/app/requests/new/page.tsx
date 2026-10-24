import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/layout/section";
import { getAuthUser } from "@/lib/auth";
import { listPublishedGames } from "@/lib/data/catalog";
import { NewRequestForm } from "@/components/requests/new-request-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajukan Permintaan Konten",
  robots: { index: false },
};

export default async function NewRequestPage() {
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/requests/new")}`);

  const games = await listPublishedGames({ page: 1 });

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/requests" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Permintaan Konten
        </Link>
      </nav>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text sm:text-3xl">
        Ajukan Permintaan Konten
      </h1>
      <NewRequestForm games={games.items.map((g) => ({ id: g.id, title: g.title }))} />
    </Section>
  );
}
