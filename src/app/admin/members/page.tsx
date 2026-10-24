import { Section } from "@/components/layout/section";
import { MembersManager } from "@/components/admin/members-manager";

export const dynamic = "force-dynamic";

export default function AdminMembersPage() {
  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Anggota & Peran</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Kelola peran anggota. Peran menentukan hak akses: <strong>Moderator</strong> (moderasi forum &
          laporan), <strong>Admin Konten</strong> (+ kelola konten), <strong>Admin Utama</strong> (+ peran,
          pengaturan, hapus).
        </p>
      </header>
      <MembersManager />
    </Section>
  );
}
