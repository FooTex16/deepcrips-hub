"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Tombol suara permintaan — satu suara per user (dicek DB via composite PK).
 * Optimistic update, rollback bila gagal.
 */
export function VoteButton({
  requestId,
  initialCount,
  initialVoted,
  className,
}: {
  requestId: string;
  initialCount: number;
  initialVoted: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [voted, setVoted] = React.useState(initialVoted);
  const [count, setCount] = React.useState(initialCount);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setVoted(initialVoted);
    setCount(initialCount);
  }, [initialVoted, initialCount]);

  const click = async () => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (busy) return;
    setBusy(true);

    const prev = { voted, count };
    setVoted(!voted);
    setCount(voted ? count - 1 : count + 1);

    try {
      const res = await fetch(`/api/requests/${requestId}/vote`, {
        method: voted ? "DELETE" : "POST",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVoted(prev.voted);
        setCount(prev.count);
        toast(json?.error ?? "Gagal menyimpan suara.", "error");
      } else {
        if (typeof json?.vote_count === "number") setCount(json.vote_count);
        router.refresh();
      }
    } catch {
      setVoted(prev.voted);
      setCount(prev.count);
      toast("Jaringan bermasalah. Coba lagi.", "error");
    }
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void click()}
      disabled={busy}
      aria-pressed={voted}
      aria-label={`Dukung permintaan ini${count > 0 ? `, ${count} suara` : ""}`}
      className={cn(
        "inline-flex h-auto min-w-[3.5rem] flex-col items-center gap-0.5 rounded-xl border px-3 py-2 transition-all active:scale-95 disabled:opacity-60",
        voted
          ? "border-brand/60 bg-brand-soft text-brand"
          : "border-border bg-surface text-text-muted hover:border-brand/40 hover:text-brand",
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <ChevronUp className="h-4 w-4" aria-hidden />
      )}
      <span className="text-sm font-bold tabular-nums">{count}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {voted ? "Didukung" : "Dukung"}
      </span>
    </button>
  );
}
