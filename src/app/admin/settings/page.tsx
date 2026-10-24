import { Section } from "@/components/layout/section";
import { SettingsManager } from "@/components/admin/settings-manager";

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Pengaturan Situs</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Kelola pengaturan non-rahasia (tautan komunitas di footer, pengumuman, dll). Hanya admin utama
          yang dapat mengubah.
        </p>
      </header>
      <SettingsManager />
    </Section>
  );
}
