"use client";

import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
const BUCKET = "content-covers";
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Input gambar: tempel URL ATAU unggah file ke Storage (bucket
 * content-covers, publik-baca). Nilai selalu berupa URL publik.
 */
export function ImageInput({
  value,
  onChange,
  disabled,
  placeholder,
  inputClassName,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const upload = async (file: File) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Format gambar harus JPG, PNG, WebP, AVIF, GIF, atau ICO.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1] || "png";
      const path = `covers/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(`Gagal mengunggah: ${err instanceof Error ? err.message : "jaringan bermasalah"}`);
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    inputClassName ??
    "w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || busy}
          className={inputCls}
        />
        <label
          className={cn(
            "inline-flex h-[42px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border px-3.5 text-sm font-medium text-text-muted transition-all hover:border-brand/40 hover:text-brand active:scale-[0.98]",
            (disabled || busy) && "pointer-events-none opacity-60"
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Upload className="h-4 w-4" aria-hidden />
          )}
          Unggah
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="sr-only"
            disabled={disabled || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- pratinjau URL bebas dari admin
        <img
          src={value}
          alt="Pratinjau gambar"
          className="h-20 rounded-xl border border-border bg-bg-subtle object-cover"
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
