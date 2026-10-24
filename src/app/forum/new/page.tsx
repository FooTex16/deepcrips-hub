import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Section } from "@/components/layout/section";
import { getAuthUser } from "@/lib/auth";
import { NewTopicForm } from "@/components/forum/new-topic-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buat Topik Baru",
  robots: { index: false },
};

export default async function NewTopicPage() {
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/forum/new")}`);

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/forum" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Forum
        </Link>
      </nav>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-text sm:text-3xl">Buat Topik Baru</h1>
      <NewTopicForm />
    </Section>
  );
}
