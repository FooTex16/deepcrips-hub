"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Paperclip, X, ImageIcon, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/lib/utils";

const REQUEST_TYPES = [
  { value: "file", label: "File / Download" },
  { value: "tutorial", label: "Tutorial" },
  { value: "video", label: "Video" },
  { value: "game", label: "Game (tambah ke katalog)" },
  { value: "other", label: "Lainnya" },
] as const;

const MAX_SCREENSHOTS = 6;
const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT =
  "image/*,.txt,.md,.json,.js,.ts,.py,.lua,.sh,.bat,.cfg,.ini,.xml,.csv,.log,.zip,.rar,.7z";

interface Item {
  file: File;
  previewUrl?: string; // hanya gambar
}

function isImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name);
}

function safeFileName(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.replace(/\.[^.]*$/, "").replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 60);
  return `${base}${ext.toLowerCase().slice(0, 12)}`;
}

/** Form pengajuan permintaan konten baru (deskripsi + script/teks + lampiran). */
export function NewRequestForm({
  games,
}: {
  games: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<string>("file");
  const [gameId, setGameId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [scriptText, setScriptText] = React.useState("");
  const [items, setItems] = React.useState<Item[]>([]);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Bersihkan object URL saat komponen dilepas.
  React.useEffect(() => {
    return () => items.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bersihkan saat unmount saja
  }, []);

  const images = items.filter((i) => isImage(i.file));
  const files = items.filter((i) => !isImage(i.file));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError(null);
    const next = [...items];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`"${file.name}" lebih dari 5 MB — file dilewati.`);
        continue;
      }
      const isImg = isImage(file);
      const count = next.filter((i) => isImage(i.file)).length;
      const countOther = next.filter((i) => !isImage(i.file)).length;
      if (isImg && count >= MAX_SCREENSHOTS) {
        setFileError(`Screenshot maksimal ${MAX_SCREENSHOTS} — "${file.name}" dilewati.`);
        continue;
      }
      if (!isImg && countOther >= MAX_ATTACHMENTS) {
        setFileError(`File lampiran maksimal ${MAX_ATTACHMENTS} — "${file.name}" dilewati.`);
        continue;
      }
      if (next.some((i) => i.file.name === file.name && i.file.size === file.size)) continue;
      next.push({ file, previewUrl: isImg ? URL.createObjectURL(file) : undefined });
    }
    setItems(next);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

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
      // 1) Upload lampiran dulu (Storage), baru kirim metadata permintaan.
      let screenshots: string[] = [];
      let attachments: Array<{ name: string; url: string; size: number; type: string }> = [];
      if (items.length > 0) {
        if (!user) {
          setError("Sesi berakhir. Login ulang sebelum mengirim lampiran.");
          setLoading(false);
          return;
        }
        const supabase = createClient();
        screenshots = [];
        attachments = [];
        let done = 0;
        for (const { file } of items) {
          done += 1;
          setProgress(`Mengupload lampiran ${done}/${items.length}…`);
          const path = `${user.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage
            .from("request-files")
            .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
          if (upErr) {
            setProgress(null);
            setError(`Gagal mengupload "${file.name}": ${upErr.message}`);
            setLoading(false);
            return;
          }
          const { data } = supabase.storage.from("request-files").getPublicUrl(path);
          if (isImage(file)) screenshots.push(data.publicUrl);
          else attachments.push({ name: file.name, url: data.publicUrl, size: file.size, type: file.type || "application/octet-stream" });
        }
        setProgress(null);
      }

      // 2) Kirim permintaan.
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          request_type: type,
          game_id: gameId || null,
          description: description.trim(),
          script_text: scriptText.trim() ? scriptText : undefined,
          screenshots,
          attachments,
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

      {/* Script / teks tempel */}
      <div>
        <label htmlFor="req-script" className="mb-1.5 block text-sm font-medium text-text">
          Script / teks tambahan{" "}
          <span className="font-normal text-text-faint">(opsional)</span>
        </label>
        <textarea
          id="req-script"
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          maxLength={20000}
          rows={5}
          spellCheck={false}
          placeholder="Tempel script/kode di sini agar admin paham exact yang Anda maksud… (mis. Lua, CFG, JSON, daftar perintah)"
          className={`${inputStyle} font-mono text-xs leading-relaxed`}
        />
        <p className="mt-1.5 text-xs text-text-faint">
          {scriptText.length}/20.000 karakter — tampil sebagai blok kode saat ditinjau admin.
        </p>
      </div>

      {/* Lampiran: screenshot + file */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-text">
          Screenshot &amp; file lampiran{" "}
          <span className="font-normal text-text-faint">(opsional)</span>
        </span>
        <p className="mb-2 text-xs text-text-faint">
          Maksimal {MAX_SCREENSHOTS} screenshot (gambar) dan {MAX_ATTACHMENTS} file lain
          (teks/script/arsip), masing-masing ≤ 5 MB. Agar permintaan lebih jelas untuk ditinjau admin.
        </p>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-4 text-sm text-text-muted transition-colors hover:border-brand/50 hover:text-text">
          <Paperclip className="h-4 w-4" aria-hidden />
          Pilih file / screenshot
          <input
            type="file"
            multiple
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {fileError && (
          <p role="alert" className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            {fileError}
          </p>
        )}

        {items.length > 0 && (
          <div className="mt-3 space-y-3">
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((item, idx) =>
                  isImage(item.file) && item.previewUrl ? (
                    <div key={`${item.file.name}-${idx}`} className="group relative overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element -- preview lokal via object URL */}
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        aria-label={`Hapus ${item.file.name}`}
                        className="absolute right-1 top-1 rounded-lg bg-black/60 p-1 text-white opacity-90 transition-opacity hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                        <ImageIcon className="mr-1 inline h-3 w-3" aria-hidden />
                        {item.file.name}
                      </span>
                    </div>
                  ) : null
                )}
              </div>
            )}
            {files.length > 0 && (
              <ul className="space-y-1.5">
                {items.map((item, idx) =>
                  !isImage(item.file) ? (
                    <li
                      key={`${item.file.name}-${idx}`}
                      className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-text">{item.file.name}</span>
                      <span className="text-xs text-text-faint">{formatBytes(item.file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        aria-label={`Hapus ${item.file.name}`}
                        className="rounded-lg p-1 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </li>
                  ) : null
                )}
              </ul>
            )}
          </div>
        )}
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
          {progress ?? "Kirim permintaan"}
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
