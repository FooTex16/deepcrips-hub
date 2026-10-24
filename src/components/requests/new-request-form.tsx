"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const REQUEST_TYPES = [
  { value: "file", label: "File / Download" },
  { value: "tutorial", label: "Tutorial" },
  { value: "video", label: "Video" },
  { value: "game", label: "Game (tambah ke katalog)" },
  { value: "other", label: "Lainnya" },
] as const;

/** Form pengajuan permintaan konten baru. */
export function NewRequestForm({
  games,
}: {
  games: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<string>("file");
  const [gameId, setGameId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Judul minimal 3 karakter.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Deskripsi minimal 10 karakter.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          request_type: type,
          game_id: gameId || null,
          description: description.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error ?? "Permintaan gagal dikirim.");
        setLoading(false);
        return;
      }
      toast("Permintaan terkirim dan menunggu tinjauan admin.", "success");
      router.push("/requests");
      router.refresh();
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    }
    setLoading(false);
  };

  const inputStyle =
    "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

  return (
    <form onSubmit={(e) => void submit(e)} className="max-w-2xl space-y-5">
      <div>
        <label htmlFor="req-title" className="mb-1.5 block text-sm font-medium text-text">
          Judul permintaan
        </label>
        <input
          id="req-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={160}
          required
          placeholder="Contoh: Script auto-headshot untuk Mobile Legends"
          className={inputStyle}
        />
        <p className="mt-1.5 text-xs text-text-faint">{title.length}/160</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="req-type" className="mb-1.5 block text-sm font-medium text-text">
            Jenis konten
          </label>
          <select
            id="req-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${inputStyle} cursor-pointer`}
          >
            {REQUEST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="req-game" className="mb-1.5 block text-sm font-medium text-text">
            Game terkait (opsional)
          </label>
          <select
            id="req-game"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className={`${inputStyle} cursor-pointer`}
          >
            <option value="">— Tanpa game —</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="req-desc" className="mb-1.5 block text-sm font-medium text-text">
          Deskripsi
        </label>
        <textarea
          id="req-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
          rows={6}
          required
          placeholder="Jelaskan konten yang Anda minta, versi/platform, dan alasan kebutuhannya…"
          className={inputStyle}
        />
        <p className="mt-1.5 text-xs text-text-faint">{description.length}/4000</p>
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
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Kirim permintaan
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-11 items-center rounded-xl border border-border-strong px-5 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
        >
          Batal
        </button>
      </div>

      <p className="text-xs text-text-faint">
        Permintaan bersifat publik. Admin akan meninjau dan mengubah statusnya. Mengajukan permintaan tidak
        menjamin konten akan dibuat.
      </p>
    </form>
  );
}
