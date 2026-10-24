import { Section } from "@/components/layout/section";
import { ReportsManager } from "@/components/admin/moderation";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Laporan Konten</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Tinjau laporan dari anggota. “Sembunyikan” menyelesaikan laporan sekaligus menyembunyikan konten
          terlapor.
        </p>
      </header>
      <ReportsManager />
    </Section>
  );
}
