import { Section } from "@/components/layout/section";
import { RequestsManager } from "@/components/admin/requests-manager";

export const dynamic = "force-dynamic";

export default function AdminRequestsPage() {
  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Permintaan Konten</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Ubah status permintaan dan beri catatan. Saat menandai “Selesai”, buat file hasilnya terlebih dahulu
          lalu tautkan lewat database.
        </p>
      </header>
      <RequestsManager />
    </Section>
  );
}
