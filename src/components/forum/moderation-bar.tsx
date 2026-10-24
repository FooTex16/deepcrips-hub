"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Eye, Lock, Unlock, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/**
 * Toolbar moderasi — hanya dirender untuk staff (dicek ulang di server).
 * Menyembunyikan/mengunci topik & menyembunyikan komentar.
 */
export function ModerationBar({
  targetType,
  targetId,
  hidden,
  locked,
}: {
  targetType: "topic" | "comment";
  targetId: string;
  hidden: boolean;
  locked?: boolean;
}) {
  const { isStaff } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  if (!isStaff) return null;

  const act = async (action: "hide" | "unhide" | "lock" | "unlock") => {
    if (busy) return;
    if (action === "hide" && !window.confirm("Sembunyikan konten ini dari publik?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/forum/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(json?.error ?? "Tindakan moderasi gagal.", "error");
      } else {
        toast("Tindakan moderasi diterapkan.", "success");
        router.refresh();
      }
    } catch {
      toast("Jaringan bermasalah.", "error");
    }
    setBusy(false);
  };

  const btn = "inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text-muted transition-colors hover:border-border-strong hover:text-text disabled:opacity-50";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", targetType === "comment" && "ml-auto")} role="group" aria-label="Moderasi">
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-faint" aria-hidden />}
      {targetType === "topic" ? (
        <>
          <button type="button" disabled={busy} onClick={() => void act(locked ? "unlock" : "lock")} className={btn}>
            {locked ? <Unlock className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
            {locked ? "Buka kunci" : "Kunci"}
          </button>
        </>
      ) : null}
      <button type="button" disabled={busy} onClick={() => void act(hidden ? "unhide" : "hide")} className={btn}>
        {hidden ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <EyeOff className="h-3.5 w-3.5" aria-hidden />}
        {hidden ? "Tampilkan" : "Sembunyikan"}
      </button>
    </div>
  );
}
