import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Vote, FileDown, Clock, MessageSquareWarning } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { ConfigMissingState } from "@/components/ui/states";
import { getAuthUser } from "@/lib/auth";import { isSupabaseReady } from "@/lib/data/home";
import { getRequest, hasUserVoted } from "@/lib/data/requests";
import { REQUEST_STATUS_META } from "@/lib/types";
import { formatDate, timeAgo, truncate } from "@/lib/utils";
import { VoteButton } from "@/components/requests/vote-button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const req = await getRequest(id);
  if (!req) return { title: "Permintaan tidak ditemukan" };
  return {
    title: truncate(req.title, 80),
    description: truncate(req.description, 160),
  };
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;
  const ready = await isSupabaseReady();
  const [req, user] = await Promise.all([getRequest(id), getAuthUser()]);

  if (!ready) {
    return (
      <Section>
        <ConfigMissingState feature="Detail permintaan" />
      </Section>
    );
  }
  if (!req) notFound();

  const voted = await hasUserVoted(user?.id ?? null, req.id);
  const meta = REQUEST_STATUS_META[req.status];
  const isOwner = user?.id === req.requester_id;

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/requests" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Permintaan Konten
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <header className="mb-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <Badge tone="neutral">{req.request_type}</Badge>
              {req.game && (
                <Link href={`/games/${req.game.slug}`}>
                  <Badge tone="info">{req.game.title}</Badge>
                </Link>
              )}
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">
              {req.title}
            </h1>
          </header>

          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Avatar src={req.requester?.avatar_url} name={req.requester?.display_name ?? "?"} size="sm" />
              <div>
                <p className="text-sm font-semibold text-text">
                  {req.requester?.display_name ?? "Anggota"}
                  {isOwner && <span className="ml-2 text-xs font-normal text-brand">(Anda)</span>}
                </p>
                <p className="text-xs text-text-faint">
                  Diajukan {timeAgo(req.created_at)} · {formatDate(req.created_at)}
                </p>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{req.description}</p>
          </div>

          {/* Catatan admin */}
          {req.admin_notes && (
            <div className="mt-6 rounded-2xl border border-brand/30 bg-brand-soft/40 p-5">
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-text">
                <MessageSquareWarning className="h-4 w-4 text-brand" aria-hidden />
                Catatan dari admin
              </p>
              <p className="whitespace-pre-wrap text-sm text-text-muted">{req.admin_notes}</p>
            </div>
          )}

          {/* Hasil (bila permintaan selesai) */}
          {req.result_file && (
            <div className="mt-6 rounded-2xl border border-success/30 bg-success/5 p-5">
              <p className="mb-2 text-sm font-semibold text-text">Konten telah dibuat</p>
              <Link
                href={`/downloads/${req.result_file.slug}`}
                className={buttonVariants("primary", "md")}
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Lihat {req.result_file.title}
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="mb-3 text-sm font-semibold text-text">Dukungan</h2>
              <div className="flex items-center gap-4">
                <VoteButton
                  requestId={req.id}
                  initialCount={req.vote_count}
                  initialVoted={voted}
                />
                <div className="text-sm text-text-muted">
                  <p className="font-medium text-text">{req.vote_count} suara</p>
                  <p className="text-xs text-text-faint">Satu suara per anggota.</p>
                </div>
              </div>
              {!user && (
                <p className="mt-3 text-xs text-text-faint">
                  Login dengan Google untuk mendukung permintaan ini.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
              <dl className="space-y-3">
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                  <div>
                    <dt className="text-text-faint">Status</dt>
                    <dd>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Vote className="mt-0.5 h-4 w-4 text-text-faint" aria-hidden />
                  <div>
                    <dt className="text-text-faint">Total dukungan</dt>
                    <dd className="text-text">{req.vote_count} suara</dd>
                  </div>
                </div>
              </dl>
              <p className="mt-4 border-t border-border pt-4 text-xs text-text-faint">
                Admin meninjau permintaan secara berkala. Status dapat berubah sewaktu-waktu.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </Section>
  );
}
