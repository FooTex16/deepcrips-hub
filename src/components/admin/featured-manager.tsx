"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { AdminTable, RowButton } from "@/components/admin/admin-table";
import { useToast } from "@/components/ui/toast";
import { fetchOptions } from "@/components/admin/use-resource";

interface FeaturedRow {
  id: string;
  section: string;
  position: number;
  game_id: string | null;
  file_id: string | null;
  tutorial_id: string | null;
  video_id: string | null;
  game: { id: string; title: string } | null;
  file: { id: string; title: string } | null;
  tutorial: { id: string; title: string } | null;
  video: { id: string; title: string } | null;
}

type Target = "game" | "file" | "tutorial" | "video";

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function FeaturedManager() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<FeaturedRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [options, setOptions] = React.useState<Record<Target, Array<{ id: string; title: string }>>>({
    game: [],
    file: [],
    tutorial: [],
    video: [],
  });

  const [section, setSection] = React.useState("home_featured");
  const [targetType, setTargetType] = React.useState<Target>("game");
  const [targetId, setTargetId] = React.useState("");
  const [position, setPosition] = React.useState("0");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api("GET", "/api/admin/featured?limit=100");
      if (!r.ok) {
        setError(r.json?.error ?? "Gagal memuat data unggulan.");
        setLoading(false);
        return;
      }
      setRows((r.json?.items ?? []) as FeaturedRow[]);
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    void (async () => {
      const [games, files, tutorials, videos] = await Promise.all([
        fetchOptions<{ id: string; title: string }>("/api/admin/games"),
        fetchOptions<{ id: string; title: string }>("/api/admin/files"),
        fetchOptions<{ id: string; title: string }>("/api/admin/tutorials"),
        fetchOptions<{ id: string; title: string }>("/api/admin/videos"),
      ]);
      setOptions({ game: games, file: files, tutorial: tutorials, video: videos });
    })();
  }, []);

  const submit = async () => {
    if (!targetId) {
      setFormError("Pilih konten yang ingin ditampilkan.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const payload: Record<string, unknown> = {
      section,
      position: Number(position) || 0,
      game_id: null,
      file_id: null,
      tutorial_id: null,
      video_id: null,
    };
    payload[`${targetType}_id`] = targetId;
    const r = await api("POST", "/api/admin/featured", payload);
    setSubmitting(false);
    if (r.ok) {
      toast("Konten unggulan ditambahkan.", "success");
      setModalOpen(false);
      setTargetId("");
      void load();
    } else {
      setFormError(r.json?.error ?? "Gagal menyimpan.");
    }
  };

  const remove = async (row: FeaturedRow) => {
    if (!window.confirm("Hapus dari unggulan?")) return;
    const r = await api("DELETE", `/api/admin/featured/${row.id}`);
    if (r.ok) {
      toast("Dihapus dari unggulan.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal menghapus.", "error");
  };

  const label = (row: FeaturedRow) =>
    row.game?.title ?? row.file?.title ?? row.tutorial?.title ?? row.video?.title ?? "—";
  const kind = (row: FeaturedRow) =>
    row.game ? "Game" : row.file ? "File" : row.tutorial ? "Tutorial" : row.video ? "Video" : "—";

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-faint">
        <Link href="/admin" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Ringkasan
        </Link>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Konten Unggulan</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
            Pilih konten yang tampil di bagian “Unggulan” beranda. Gunakan section{" "}
            <code className="text-xs">home_featured</code> untuk file unggulan beranda.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah unggulan
        </button>
      </header>

      <AdminTable<FeaturedRow>
        columns={[
          { key: "section", header: "Section", render: (r) => <code className="text-xs">{r.section}</code> },
          { key: "kind", header: "Jenis", render: (r) => kind(r) },
          { key: "label", header: "Konten", render: (r) => <span className="font-medium">{label(r)}</span> },
          { key: "position", header: "Posisi", render: (r) => r.position },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage="Belum ada konten unggulan."
        rowActions={(r) => (
          <RowButton onClick={() => void remove(r)} tone="danger">
            <Trash2 className="h-3 w-3" aria-hidden /> Hapus
          </RowButton>
        )}
      />

      {/* Modal tambah */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah unggulan"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-5 text-lg font-semibold text-text">Tambah unggulan</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="feat-section" className="mb-1.5 block text-sm font-medium text-text">
                  Section
                </label>
                <input
                  id="feat-section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
              <div>
                <label htmlFor="feat-type" className="mb-1.5 block text-sm font-medium text-text">
                  Jenis konten
                </label>
                <select
                  id="feat-type"
                  value={targetType}
                  onChange={(e) => {
                    setTargetType(e.target.value as Target);
                    setTargetId("");
                  }}
                  className="w-full cursor-pointer rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                >
                  <option value="game">Game</option>
                  <option value="file">File</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="video">Video</option>
                </select>
              </div>
              <div>
                <label htmlFor="feat-target" className="mb-1.5 block text-sm font-medium text-text">
                  Konten
                </label>
                <select
                  id="feat-target"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                >
                  <option value="">— Pilih konten —</option>
                  {options[targetType].map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
                {options[targetType].length === 0 && (
                  <p className="mt-1 text-xs text-text-faint">Belum ada konten jenis ini.</p>
                )}
              </div>
              <div>
                <label htmlFor="feat-position" className="mb-1.5 block text-sm font-medium text-text">
                  Posisi (urutan)
                </label>
                <input
                  id="feat-position"
                  type="number"
                  min="0"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
              </div>
              {formError && (
                <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="inline-flex h-10 items-center rounded-xl border border-border-strong px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting}
                  className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover disabled:opacity-60"
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
