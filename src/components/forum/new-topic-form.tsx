"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

/** Form pembuatan topik forum baru. */
export function NewTopicForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Judul minimal 3 karakter.");
      return;
    }
    if (!body.trim()) {
      setError("Isi topik tidak boleh kosong.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/forum/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Topik gagal dibuat.");
        setLoading(false);
        return;
      }
      toast("Topik berhasil dibuat.", "success");
      const id = json?.topic?.id as string | undefined;
      router.push(id ? `/forum/${id}` : "/forum");
      router.refresh();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-text">
          Judul topik
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
          placeholder="Ringkas dan jelas…"
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
        <p className="mt-1.5 text-xs text-text-faint">{title.length}/160 karakter</p>
      </div>

      <div>
        <label htmlFor="body" className="mb-1.5 block text-sm font-medium text-text">
          Isi topik
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={20000}
          rows={10}
          required
          placeholder="Jelaskan pertanyaan atau topik diskusi Anda…"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-relaxed text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        />
        <p className="mt-1.5 text-xs text-text-faint">
          Dukungan Markdown ringan: **tebal**, *miring*, `kode`, daftar, dan kutipan.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {loading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          )}
          Buat topik
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 items-center rounded-xl border border-border-strong px-5 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
