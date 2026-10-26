"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { AdminFormModal, type FieldDef, type FormValues } from "@/components/admin/admin-form";
import { YoutubeIcon } from "@/components/brand/youtube-icon";
import { SmartImg } from "@/components/ui/smart-img";
import { useToast } from "@/components/ui/toast";

interface PreviewEntry {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
}

interface ImportOpts {
  channel: string;
  limit: number;
  status: string;
}

/**
 * Tombol + modal impor video terbaru dari channel YouTube (feed resmi +
 * fallback halaman channel, tanpa API key).
 *
 * Alur dua langkah:
 * 1. Isi channel → "Muat video" → daftar video diambil TANPA disimpan
 *    (endpoint preview) dan ditampilkan sebagai thumbnail yang bisa dipilih.
 * 2. Pilih video (centang) → "Impor" → hanya video terpilih yang disimpan.
 *
 * Channel terakhir disimpan di site_settings.youtube_channel.
 */
export function YoutubeImport({ onImported }: { onImported: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<"form" | "select">("form");
  const [initial, setInitial] = React.useState<FormValues | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [opts, setOpts] = React.useState<ImportOpts | null>(null);
  const [entries, setEntries] = React.useState<PreviewEntry[]>([]);
  const [existingIds, setExistingIds] = React.useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());

  const fields: FieldDef[] = React.useMemo(
    () => [
      {
        name: "channel",
        label: "Channel YouTube",
        type: "text",
        required: true,
        placeholder: "@namachannel atau https://www.youtube.com/@namachannel",
        help: "Boleh ID UC…, URL channel, atau handle @…. Diingat untuk impor berikutnya.",
      },
      {
        name: "limit",
        label: "Jumlah video terbaru",
        type: "select",
        options: [5, 10, 15].map((n) => ({ value: String(n), label: `${n} video` })),
      },
      {
        name: "status",
        label: "Status setelah impor",
        type: "select",
        options: [
          { value: "published", label: "Terbit — langsung tampil" },
          { value: "draft", label: "Draf — tinjau dulu" },
        ],
      },
    ],
    []
  );

  const openModal = async () => {
    setError(null);
    setStep("form");
    let channel = process.env.NEXT_PUBLIC_YOUTUBE_HANDLE
      ? `@${process.env.NEXT_PUBLIC_YOUTUBE_HANDLE}`
      : "";
    try {
      const res = await fetch("/api/admin/settings?limit=100");
      const json = (await res.json().catch(() => ({}))) as {
        items?: Array<{ key: string; value: { channel?: string } | null }>;
      };
      const saved = (json.items ?? []).find((s) => s.key === "youtube_channel");
      if (saved?.value?.channel) channel = saved.value.channel;
    } catch {
      /* pakai fallback */
    }
    setInitial({ channel, limit: "10", status: "published" });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSubmitting(false);
    setError(null);
  };

  /** Langkah 1 → ambil daftar video (pratinjau, belum disimpan). */
  const preview = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    const nextOpts: ImportOpts = {
      channel: String(values.channel ?? "").trim(),
      limit: Number(values.limit || 10),
      status: values.status === "draft" ? "draft" : "published",
    };
    try {
      const res = await fetch("/api/admin/videos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nextOpts, preview: true }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        entries?: PreviewEntry[];
        existingIds?: string[];
      };
      setSubmitting(false);
      if (!res.ok) {
        setError(json.error ?? "Gagal mengambil daftar video.");
        return;
      }
      const list = json.entries ?? [];
      if (list.length === 0) {
        setError("Channel ini tidak punya video yang bisa diimpor.");
        return;
      }
      const exist = new Set(json.existingIds ?? []);
      setOpts(nextOpts);
      setInitial(values);
      setEntries(list);
      setExistingIds(exist);
      // Default: video yang belum pernah diimpor ikut tercentang.
      setSelected(new Set(list.filter((e) => !exist.has(e.videoId)).map((e) => e.videoId)));
      setStep("select");
    } catch {
      setSubmitting(false);
      setError("Jaringan bermasalah.");
    }
  };

  /** Langkah 2 → impor hanya video yang dipilih. */
  const doImport = async () => {
    if (!opts || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/videos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...opts, videoIds: [...selected] }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        imported?: number;
        skipped?: number;
        message?: string;
      };
      setSubmitting(false);
      if (!res.ok) {
        setError(json.error ?? "Gagal mengimpor video.");
        return;
      }
      const imported = json.imported ?? 0;
      const skipped = json.skipped ?? 0;
      const msg =
        imported > 0
          ? `${imported} video diimpor${skipped ? `, ${skipped} sudah ada dan dilewati` : ""}.`
          : (json.message ?? "Tidak ada video baru untuk diimpor.");
      toast(msg, "success");
      close();
      onImported();
    } catch {
      setSubmitting(false);
      setError("Jaringan bermasalah.");
    }
  };

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const dateLabel = (iso: string): string => {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return "";
    return new Date(t).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void openModal()}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text-muted transition-all hover:border-brand/40 hover:text-brand active:scale-[0.98]"
      >
        <YoutubeIcon className="h-4 w-4" />
        Impor video terbaru
      </button>

      {step === "form" && (
        <AdminFormModal
          open={open}
          title="Impor video dari YouTube"
          fields={fields}
          initialValues={initial ?? undefined}
          onSubmit={(v) => void preview(v)}
          onClose={close}
          submitting={submitting}
          error={error}
        />
      )}

      {open && step === "select" && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Pilih video untuk diimpor"
          onClick={close}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-text">Pilih video untuk diimpor</h2>
                <p className="mt-0.5 truncate text-xs text-text-faint">
                  {opts?.channel} · {entries.length} video terbaru ditemukan
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup"
                className="rounded-lg p-1.5 text-text-faint transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {entries.map((e) => {
                const exists = existingIds.has(e.videoId);
                const checked = selected.has(e.videoId);
                const date = dateLabel(e.published);
                return (
                  <label
                    key={e.videoId}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                      exists
                        ? "border-border bg-bg-subtle/50 opacity-70"
                        : checked
                          ? "border-brand/50 bg-brand-soft/40"
                          : "border-border bg-bg-subtle hover:border-border-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={exists || submitting}
                      onChange={() => toggle(e.videoId)}
                      className="h-4 w-4 shrink-0 accent-brand"
                      aria-label={`Pilih ${e.title}`}
                    />
                    {/* Thumbnail video: gambar statis, tanpa iframe. */}
                    <SmartImg
                      src={e.thumbnail}
                      className="h-14 w-24 shrink-0 rounded-lg border border-border"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{e.title}</span>
                      <span className="mt-0.5 block text-xs text-text-faint">
                        {date}
                        {exists && <span className="ml-1.5 text-warning">· sudah ada di situs</span>}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setError(null);
                }}
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => void doImport()}
                disabled={submitting || selected.size === 0}
                className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-60"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Impor {selected.size} video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
