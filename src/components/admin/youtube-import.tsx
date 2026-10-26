"use client";

import * as React from "react";
import { AdminFormModal, type FieldDef, type FormValues } from "@/components/admin/admin-form";
import { YoutubeIcon } from "@/components/brand/youtube-icon";
import { useToast } from "@/components/ui/toast";

/**
 * Tombol + modal impor video terbaru dari channel YouTube (feed RSS resmi,
 * tanpa API key). Channel terakhir disimpan di site_settings.youtube_channel.
 */
export function YoutubeImport({ onImported }: { onImported: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [initial, setInitial] = React.useState<FormValues | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/videos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: String(values.channel ?? "").trim(),
          limit: Number(values.limit || 10),
          status: values.status === "draft" ? "draft" : "published",
        }),
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
      setOpen(false);
      onImported();
    } catch {
      setSubmitting(false);
      setError("Jaringan bermasalah.");
    }
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

      <AdminFormModal
        open={open}
        title="Impor video dari YouTube"
        fields={fields}
        initialValues={initial ?? undefined}
        onSubmit={(v) => void submit(v)}
        onClose={() => setOpen(false)}
        submitting={submitting}
        error={error}
      />
    </>
  );
}
