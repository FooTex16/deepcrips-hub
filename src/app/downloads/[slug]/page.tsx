import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Download,
  LogIn,
  Gamepad2,
  Calendar,
  HardDrive,
  Globe,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { SmartImg } from "@/components/ui/smart-img";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseReady } from "@/lib/data/home";
import { getFileBySlug, getFileVersions } from "@/lib/data/catalog";
import {
  CHECK_STATUS_META,
  VERSION_STATUS_META,
  HIGH_RISK_CATEGORIES,
  fileCategoryLabel,
  type CheckStatus,
} from "@/lib/types";
import { cn, formatBytes, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const file = await getFileBySlug(slug);
  if (!file || file.status !== "published") return { title: "File tidak ditemukan" };
  return {
    title: file.title,
    description: file.summary ?? `Download ${file.title} — ${fileCategoryLabel(file.category)}.`,
    openGraph: { title: `${file.title} · DeepCrips Hub`, description: file.summary ?? undefined },
  };
}

const CHECK_ICON: Record<CheckStatus, React.ReactNode> = {
  unverified: <ShieldQuestion className="h-4 w-4" aria-hidden />,
  manual_review: <ShieldCheck className="h-4 w-4" aria-hidden />,
  hash_matched: <ShieldCheck className="h-4 w-4" aria-hidden />,
  reported_issue: <ShieldAlert className="h-4 w-4" aria-hidden />,
};

/** Penjelasan jujur apa yang benar-benar diperiksa. */
const CHECK_EXPLANATION: Record<CheckStatus, string> = {
  unverified: "File ini belum melalui pemeriksaan admin. Unduh dengan lebih berhati-hati.",
  manual_review:
    "Admin telah meninjau file ini secara manual (sumber, kelengkapan, dan catatan risiko). Ini bukan jaminan bebas malware.",
  hash_matched:
    "SHA-256 dicatat dan cocok dengan file pembanding yang diperoleh admin. Kecocokan hash membuktikan kesamaan byte — bukan jaminan bebas malware.",
  reported_issue: "Ada laporan masalah pada file ini. Periksa catatan sebelum mengunduh.",
};

export default async function FileDetailPage({ params }: Props) {
  const { slug } = await params;
  const ready = await isSupabaseReady();
  const [file, user] = await Promise.all([getFileBySlug(slug), getAuthUser()]);

  if (!ready) {
    return (
      <Section>
        <h1 className="mb-6 text-2xl font-bold text-text">Detail File</h1>
        <ConfigMissingState feature="Detail file" />
      </Section>
    );
  }
  if (!file || file.status !== "published") notFound();

  const versions = await getFileVersions(file.id);
  const highRisk = HIGH_RISK_CATEGORIES.has(file.category);
  const nextPath = `/downloads/${file.slug}`;

  return (
    <Section className="pt-8 sm:pt-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/downloads" className="hover:text-text">
              Download
            </Link>
          </li>
          <li aria-hidden>/</li>
          {file.game && (
            <>
              <li>
                <Link href={`/games/${file.game.slug}`} className="hover:text-text">
                  {file.game.title}
                </Link>
              </li>
              <li aria-hidden>/</li>
            </>
          )}
          <li className="text-text" aria-current="page">
            {file.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <header className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="info">{fileCategoryLabel(file.category)}</Badge>
              <Badge tone={CHECK_STATUS_META[file.check_status].tone} icon={CHECK_ICON[file.check_status]}>
                {CHECK_STATUS_META[file.check_status].label}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{file.title}</h1>
            {file.summary && <p className="mt-2 text-base text-text-muted">{file.summary}</p>}
          </header>

          {/* Peringatan risiko untuk jenis file berisiko */}
          {highRisk && (
            <div className="mb-6 flex gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
              <div className="text-sm">
                <p className="font-semibold text-text">Peringatan risiko</p>
                <p className="mt-1 text-text-muted">
                  File jenis ini (<strong>{fileCategoryLabel(file.category)}</strong>) dapat memengaruhi game atau
                  sistem Anda. Pahami apa yang dilakukan file sebelum menjalankannya, gunakan akun cadangan bila
                  relevan, dan pastikan Anda mengunduh dari sumber yang Anda percaya.
                </p>
              </div>
            </div>
          )}

          {/* Penjelasan pemeriksaan */}
          <div className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="font-semibold text-text">Status pemeriksaan</p>
            <p className="mt-1 text-text-muted">{CHECK_EXPLANATION[file.check_status]}</p>
            {file.check_notes && <p className="mt-2 text-text-muted">Catatan: {file.check_notes}</p>}
          </div>

          {file.description && (
            <article className="prose-dc mb-8 whitespace-pre-wrap">{file.description}</article>
          )}

          {/* Screenshot */}
          {file.screenshots?.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-text">Screenshot</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {file.screenshots.map((url, i) => (
                  <SmartImg
                    key={i}
                    src={url}
                    alt={`Screenshot ${i + 1} ${file.title}`}
                    className="aspect-video rounded-xl border border-border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Riwayat versi */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-text">Riwayat Versi</h2>
            {versions.length === 0 ? (
              <EmptyState
                title="Belum ada versi"
                description="Admin belum menambahkan versi untuk file ini."
              />
            ) : (
              <ol className="space-y-4">
                {versions.map((version) => {
                  const vStatus = VERSION_STATUS_META[version.status as keyof typeof VERSION_STATUS_META];
                  const activeHosts = version.hosts.filter((h) => h.is_active && h.status === "active");
                  return (
                    <li
                      key={version.id}
                      className={cn(
                        "rounded-2xl border bg-surface p-5",
                        version.is_latest ? "border-brand/50" : "border-border"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-text">v{version.version_label}</h3>
                        {version.is_latest && <Badge tone="brand">Terbaru</Badge>}
                        <Badge tone={vStatus.tone}>{vStatus.label}</Badge>
                      </div>

                      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-text-muted">
                        {version.released_at && (
                          <div className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-text-faint" aria-hidden />
                            <dt className="sr-only">Tanggal rilis</dt>
                            <dd>{formatDate(version.released_at)}</dd>
                          </div>
                        )}
                        {version.compatibility && (
                          <div className="inline-flex items-center gap-1.5">
                            <HardDrive className="h-4 w-4 text-text-faint" aria-hidden />
                            <dt className="sr-only">Kompatibilitas</dt>
                            <dd>{version.compatibility}</dd>
                          </div>
                        )}
                      </dl>

                      {version.release_notes && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-text-muted">{version.release_notes}</p>
                      )}

                      {version.sha256 && (
                        <p className="mt-3 inline-flex max-w-full items-start gap-1.5 break-all text-xs text-text-faint">
                          <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="font-mono">{version.sha256}</span>
                        </p>
                      )}

                      {/* Host download */}
                      <div className="mt-4 border-t border-border pt-4">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                          Host unduhan
                        </p>
                        {version.status === "unavailable" ? (
                          <p className="text-sm text-text-muted">Versi ini tidak tersedia saat ini.</p>
                        ) : version.hosts.length === 0 ? (
                          <p className="text-sm text-text-muted">Belum ada host untuk versi ini.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2.5">
                            {version.hosts.map((host, idx) => {
                              const usable = host.is_active && host.status === "active";
                              const label =
                                usable && activeHosts[0] && host.id !== activeHosts[0].id
                                  ? `Alternatif ${idx + 1}`
                                  : host.name;
                              if (!usable) return null;
                              const href = user ? `/api/download/${host.id}` : `/login?next=${encodeURIComponent(nextPath)}`;
                              return (
                                <Link
                                  key={host.id}
                                  href={href}
                                  className={cn(
                                    buttonVariants(host === activeHosts[0] ? "primary" : "outline", "md")
                                  )}
                                >
                                  {user ? (
                                    <Download className="h-4 w-4" aria-hidden />
                                  ) : (
                                    <LogIn className="h-4 w-4" aria-hidden />
                                  )}
                                  {user ? `Unduh via ${label}` : `Masuk untuk unduh · ${label}`}
                                </Link>
                              );
                            })}
                            {/* Nonaktif ditampilkan sebagai catatan, bukan tombol */}
                            {version.hosts.some((h) => !(h.is_active && h.status === "active")) && (
                              <p className="w-full text-xs text-text-faint">
                                Beberapa host sedang nonaktif/dilaporkan bermasalah dan tidak ditampilkan.
                              </p>
                            )}
                          </div>
                        )}
                        {!user && version.hosts.length > 0 && version.status !== "unavailable" && (
                          <p className="mt-2 text-xs text-text-muted">
                            Login dengan Google diperlukan untuk mengunduh.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Sidebar metadata */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-text">Informasi File</h2>
              <dl className="space-y-3 text-sm">
                {file.game && (
                  <div className="flex items-start gap-2">
                    <Gamepad2 className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                    <div>
                      <dt className="text-text-faint">Game</dt>
                      <dd>
                        <Link href={`/games/${file.game.slug}`} className="font-medium text-brand hover:underline">
                          {file.game.title}
                        </Link>
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                  <div>
                    <dt className="text-text-faint">Diterbitkan</dt>
                    <dd className="text-text">{file.published_at ? formatDate(file.published_at) : "—"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <HardDrive className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                  <div>
                    <dt className="text-text-faint">Ukuran</dt>
                    <dd className="text-text">
                      {file.size_bytes ? formatBytes(file.size_bytes) : "Tidak diketahui"}
                    </dd>
                  </div>
                </div>
                {file.source_info && (
                  <div className="flex items-start gap-2">
                    <Globe className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                    <div>
                      <dt className="text-text-faint">Sumber</dt>
                      <dd className="text-text-muted">{file.source_info}</dd>
                    </div>
                  </div>
                )}
              </dl>

              {file.security_notes && (
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="mb-1.5 text-sm font-semibold text-text">Catatan keamanan</h3>
                  <p className="whitespace-pre-wrap text-sm text-text-muted">{file.security_notes}</p>
                </div>
              )}

              <p className="mt-4 border-t border-border pt-4 text-xs text-text-faint">
                Kami tidak mengklaim file 100% aman. Unduh hanya bila Anda memahami risikonya. Baca{" "}
                <Link href="/security" className="text-brand hover:underline">
                  informasi keamanan
                </Link>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
