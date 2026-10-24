import { Section } from "@/components/layout/section";
import { ForumModeration } from "@/components/admin/moderation";

export const dynamic = "force-dynamic";

export default function AdminForumPage() {
  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Moderasi Forum</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Sembunyikan/tampilkan topik & komentar, kunci/buka topik. Setiap tindakan tercatat di log audit.
        </p>
      </header>
      <ForumModeration />
    </Section>
  );
}
