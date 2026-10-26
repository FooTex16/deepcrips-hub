import Link from "next/link";
import type { Metadata } from "next";
import {
  Gamepad2,
  FileDown,
  BookOpen,
  Video,
  MessagesSquare,
  Flag,
  Vote,
  MousePointerClick,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Section } from "@/components/layout/section";
import { ConfigMissingState } from "@/components/ui/states";
import { AmbientBackground } from "@/components/motion/ambient-bg";
import { ScrambleText } from "@/components/motion/scramble-text";
import { SocialLinks } from "@/components/social/social-links";
import { isSupabaseReady } from "@/lib/data/home";
import { getAdminOverview } from "@/lib/data/admin";
import {
  DEFAULT_TYPEWRITER_PHRASES,
  getSocialLinks,
  getTypewriterPhrases,
} from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ringkasan",
};

export default async function AdminOverviewPage() {
  const [ready, stats, phrases, socials] = await Promise.all([
    isSupabaseReady(),
    getAdminOverview(),
    getTypewriterPhrases(),
    getSocialLinks(),
  ]);
  // null = belum pernah diatur → pakai default; [] = admin mematikan animasi.
  const typewriterPhrases = phrases ?? DEFAULT_TYPEWRITER_PHRASES;

  const cards = [
    { label: "Game", value: stats.games, href: "/admin/games", icon: Gamepad2 },
    { label: "File", value: stats.files, href: "/admin/files", icon: FileDown },
    { label: "File terbit", value: stats.publishedFiles, href: "/admin/files?status=published", icon: FileDown },
    { label: "Tutorial", value: stats.tutorials, href: "/admin/tutorials", icon: BookOpen },
    { label: "Video", value: stats.videos, href: "/admin/videos", icon: Video },
    { label: "Topik forum", value: stats.topics, href: "/admin/forum", icon: MessagesSquare },
    { label: "Laporan terbuka", value: stats.openReports, href: "/admin/reports", icon: Flag, alert: stats.openReports > 0 },
    {
      label: "Permintaan pending",
      value: stats.pendingRequests,
      href: "/admin/requests",
      icon: Vote,
      alert: stats.pendingRequests > 0,
    },
  ];

  return (
    <Section className="relative isolate py-6 sm:py-8">
      {/* Latar gradien bergerak loop di balik dashboard */}
      <AmbientBackground />

      <header className="relative mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {typewriterPhrases.length > 0 ? (
            <ScrambleText phrases={typewriterPhrases} srText="Ringkasan" />
          ) : (
            "Ringkasan"
          )}
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Gambaran umum konten dan aktivitas komunitas DeepCrips Hub.
        </p>
      </header>

      {!ready && (
        <div className="mb-6">
          <ConfigMissingState feature="Statistik admin" />
        </div>
      )}

      {/* Kartu statistik */}
      <div className="dc-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon
                  className="h-4 w-4 transition-transform duration-150 group-hover:-rotate-3 group-hover:scale-110"
                  aria-hidden
                />
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-2xl font-bold text-text">
                {stats.ready ? c.value.toLocaleString("id-ID") : "—"}
                {c.alert && <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />}
              </p>
              <p className="text-sm text-text-muted">{c.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Klik unduhan */}
      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <MousePointerClick className="h-4 w-4" aria-hidden />
        </span>
        <p className="mt-3 text-2xl font-bold text-text">
          {stats.ready ? stats.totalClicks.toLocaleString("id-ID") : "—"}
        </p>
        <p className="text-sm text-text-muted">Total klik unduhan tercatat</p>
        <p className="mt-1 text-xs text-text-faint">
          7 hari terakhir: {stats.ready ? stats.recentClicks7d.toLocaleString("id-ID") : "—"} klik
          <span className="ml-1">(angka ini mencatat KLIK, bukan unduhan sukses).</span>
        </p>
      </div>

      {/* Aksi cepat */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-text">Aksi cepat</h2>
        <div className="dc-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction href="/admin/games" label="Tambah game baru" />
          <QuickAction href="/admin/files" label="Kelola file & versi" />
          <QuickAction href="/admin/reports" label="Tinjau laporan" />
          <QuickAction href="/admin/requests" label="Proses permintaan" />
          <QuickAction href="/admin/featured" label="Atur konten unggulan" />
          <QuickAction href="/admin/audit" label="Lihat log audit" />
        </div>
      </div>

      {/* Media sosial di bawah dashboard */}
      {socials.length > 0 && (
        <div className="relative mt-8 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-text">Media sosial DeepCrips</h2>
          <p className="mt-1 text-sm text-text-muted">
            Kanal resmi — kelola di menu Pengaturan → Tampilan situs.
          </p>
          <SocialLinks links={socials} className="mt-4" />
        </div>
      )}
    </Section>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch={true}
      className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-text-muted transition-all duration-150 hover:border-brand/40 hover:text-brand active:scale-[0.98]"
    >
      {label}
      <ArrowRight
        className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
