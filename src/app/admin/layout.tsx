import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthUser, getStaffContext } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/logo";
import { AdminNavClient, type NavItem } from "@/components/admin/admin-nav-client";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · DeepCrips Hub" },
  robots: { index: false, follow: false },
};

// Ikon dirujuk lewat string dan diresolusi di dalam AdminNavClient (client
// component) — meneruskan fungsi komponen sebagai prop ke client component
// dibatalkan React dengan error 500.
const NAV: NavItem[] = [
  { href: "/admin", label: "Ringkasan", icon: "dashboard", exact: true },
  { href: "/admin/games", label: "Game", icon: "game" },
  { href: "/admin/files", label: "File & Versi", icon: "file" },
  { href: "/admin/tutorials", label: "Tutorial", icon: "tutorial" },
  { href: "/admin/videos", label: "Video", icon: "video" },
  { href: "/admin/featured", label: "Unggulan", icon: "featured" },
  { href: "/admin/forum", label: "Moderasi Forum", icon: "forum" },
  { href: "/admin/reports", label: "Laporan", icon: "reports" },
  { href: "/admin/requests", label: "Permintaan", icon: "requests" },
  { href: "/admin/members", label: "Anggota & Peran", icon: "members" },
  { href: "/admin/settings", label: "Pengaturan", icon: "settings" },
  { href: "/admin/audit", label: "Log Audit", icon: "audit" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/admin")}`);

  const staff = await getStaffContext();
  if (!staff?.isStaff) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold text-text">Akses ditolak</h1>
        <p className="mt-2 text-sm text-text-muted">
          Halaman admin hanya tersedia untuk moderator dan admin. Hubungi admin utama bila Anda merasa ini
          keliru.
        </p>
        <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-brand hover:underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="container flex flex-col gap-6 py-6 lg:flex-row lg:gap-8">
      {/* Sidebar */}
      <aside className="lg:w-60 lg:shrink-0">
        <div className="sticky top-24">
          <Link href="/admin" className="mb-4 hidden items-center gap-2 lg:flex">
            <BrandLogo className="h-8" />
            <span className="whitespace-nowrap text-sm font-bold text-text">Panel Admin</span>
          </Link>
          <AdminNavClient items={NAV} isPrimaryAdmin={staff.isPrimaryAdmin} />
        </div>
      </aside>

      {/* Konten */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
