"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";

/** Form komentar pada halaman topik. */
export function CommentForm({ topicId, parentId }: { topicId: string; parentId?: string }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      setError("Komentar tidak boleh kosong.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forum/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId, body: body.trim(), parent_id: parentId ?? null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Komentar gagal dikirim.");
        setLoading(false);
        return;
      }
      setBody("");
      toast("Komentar terkirim.", "success");
      router.refresh();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <form onSubmit={(e) => void submit(e)} className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-3">
        <Avatar src={profile?.avatar_url} name={profile?.display_name ?? "Anda"} size="sm" className="mt-0.5" />
        <div className="flex-1">
          <label htmlFor={`comment-${parentId ?? "root"}`} className="sr-only">
            Tulis komentar
          </label>
          <textarea
            id={`comment-${parentId ?? "root"}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={10000}
            rows={parentId ? 3 : 4}
            placeholder={parentId ? "Tulis balasan…" : "Tulis komentar…"}
            className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between">
            <p className="text-xs text-text-faint">{body.length}/10000</p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-60"
            >
              {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />}
              {parentId ? "Balas" : "Kirim komentar"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
