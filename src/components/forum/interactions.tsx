"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, Flag } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REACTION_EMOJIS } from "@/lib/types";

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: json?.error ?? "Permintaan gagal." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Jaringan bermasalah. Coba lagi." };
  }
}

/** Baris tombol reaksi emoji (topik atau komentar). */
export function ReactionBar({
  targetType,
  targetId,
  counts,
  active,
  className,
}: {
  targetType: "topic" | "comment";
  targetId: string;
  counts: Record<string, number>;
  active: Set<string>;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = React.useState<{ counts: Record<string, number>; active: Set<string> }>({
    counts,
    active,
  });
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setState({ counts, active });
  }, [counts, active]);

  const toggle = async (emoji: string) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (busy) return;
    setBusy(true);

    const isActive = state.active.has(emoji);
    const prev = state;
    const nextActive = new Set(state.active);
    const nextCounts = { ...state.counts };
    if (isActive) {
      nextActive.delete(emoji);
      nextCounts[emoji] = Math.max(0, (nextCounts[emoji] ?? 1) - 1);
    } else {
      nextActive.add(emoji);
      nextCounts[emoji] = (nextCounts[emoji] ?? 0) + 1;
    }
    setState({ counts: nextCounts, active: nextActive });

    const result = await postJson("/api/forum/reactions", {
      target_type: targetType,
      target_id: targetId,
      emoji,
      action: isActive ? "remove" : "add",
    });

    if (!result.ok) {
      setState(prev);
      toast(result.error ?? "Gagal menyimpan reaksi.", "error");
    } else {
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group" aria-label="Reaksi">
      {REACTION_EMOJIS.map((emoji) => {
        const isActive = state.active.has(emoji);
        const count = state.counts[emoji] ?? 0;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => void toggle(emoji)}
            aria-pressed={isActive}
            aria-label={`Reaksi ${emoji}${count > 0 ? `, ${count} reaksi` : ""}`}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm transition-all duration-150 active:scale-95",
              isActive
                ? "border-brand/50 bg-brand-soft text-brand"
                : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"
            )}
          >
            <span aria-hidden>{emoji}</span>
            {count > 0 && <span className="text-xs font-semibold tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Tombol login untuk pengunjung (mis. tombol "Buat Komentar"). */
export function LoginPrompt({ next, message }: { next: string; message?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-surface/60 p-5">
      <p className="text-sm text-text-muted">
        {message ?? "Masuk dengan Google untuk berpartisipasi dalam diskusi ini."}
      </p>
      <a href={`/login?next=${encodeURIComponent(next)}`} className={buttonVariants("primary", "sm")}>
        <LogIn className="h-4 w-4" aria-hidden />
        Masuk
      </a>
    </div>
  );
}

/** Tombol laporkan konten (topik/komentar). */
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "topic" | "comment";
  targetId: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!user) return null;

  const submit = async () => {
    if (!reason.trim()) {
      setError("Pilih alasan laporan.");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await postJson("/api/forum/reports", {
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim(),
      details: details.trim() || undefined,
    });
    setLoading(false);
    if (result.ok) {
      toast("Laporan terkirim. Terima kasih telah membantu menjaga komunitas.", "success");
      setOpen(false);
      setReason("");
      setDetails("");
      router.refresh();
    } else {
      setError(result.error ?? "Laporan gagal dikirim.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Laporkan konten"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-text-faint transition-colors hover:bg-danger/10 hover:text-danger"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Laporkan
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Laporkan konten"
        description="Laporan ditinjau moderator. Jangan gunakan fitur ini untuk spam."
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 items-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void submit()}
              className="inline-flex h-10 items-center rounded-xl bg-danger px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {loading && (
                <span aria-hidden className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Kirim laporan
            </button>
          </>
        }
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-text">Alasan</legend>
          {["Spam", "Konten menyesatkan", "Pelecehan / bahasa kasar", "Tautan berbahaya", "Lainnya"].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:border-border-strong">
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 accent-brand"
              />
              {r}
            </label>
          ))}
        </fieldset>
        <label htmlFor="report-details" className="mt-4 block text-sm font-medium text-text">
          Detail (opsional)
        </label>
        <textarea
          id="report-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Jelaskan masalahnya…"
          className="mt-1.5 w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
