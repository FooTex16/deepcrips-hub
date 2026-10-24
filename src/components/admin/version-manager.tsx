"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Star, Link2 } from "lucide-react";
import { AdminTable, RowButton, StatusBadge } from "@/components/admin/admin-table";
import { AdminFormModal, buildPayload, type FieldDef, type FormValues } from "@/components/admin/admin-form";
import { useToast } from "@/components/ui/toast";
import { VERSION_STATUS_META, HOST_STATUS_META } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface VersionRow {
  id: string;
  file_id: string;
  version_label: string;
  release_notes: string | null;
  released_at: string | null;
  sha256: string | null;
  compatibility: string | null;
  status: string;
  is_latest: boolean;
  created_at: string;
}

interface HostRow {
  id: string;
  file_version_id: string;
  name: string;
  url: string;
  is_active: boolean;
  status: string;
  priority: number;
  status_note: string | null;
}

const VERSION_FIELDS: FieldDef[] = [
  { name: "version_label", label: "Label versi", type: "text", required: true, placeholder: "1.0.0" },
  { name: "release_notes", label: "Catatan rilis", type: "textarea", rows: 3 },
  { name: "released_at", label: "Tanggal rilis", type: "datetime-local" },
  {
    name: "sha256",
    label: "SHA-256 (opsional)",
    type: "text",
    placeholder: "64 karakter hex",
    help: "Checksum 64 karakter hex huruf kecil. Tampil publik sebagai info integritas.",
  },
  { name: "compatibility", label: "Kompatibilitas", type: "text", placeholder: "Android 10+, PC, dll." },
  {
    name: "status",
    label: "Status versi",
    type: "select",
    required: true,
    options: Object.entries(VERSION_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
  },
  {
    name: "is_latest",
    label: "Jadikan versi terbaru (latest)",
    type: "checkbox",
    help: "Versi lain otomatis diturunkan (hanya satu latest per file).",
  },
];

const HOST_FIELDS: FieldDef[] = [
  { name: "name", label: "Nama host", type: "text", required: true, placeholder: "Google Drive, MediaFire…" },
  {
    name: "url",
    label: "URL unduhan",
    type: "text",
    required: true,
    placeholder: "https://…",
    help: "URL divalidasi server (http/https, blokir host privat). Hanya admin yang melihat URL ini.",
  },
  { name: "priority", label: "Prioritas", type: "number", min: "0", max: "1000", help: "Lebih kecil = tampil lebih dulu." },
  {
    name: "status",
    label: "Status host",
    type: "select",
    required: true,
    options: Object.entries(HOST_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
  },
  { name: "is_active", label: "Aktif", type: "checkbox" },
  { name: "status_note", label: "Catatan status", type: "textarea", rows: 2 },
];

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

export function VersionManager({ fileId, fileTitle }: { fileId: string; fileTitle: string }) {
  const { toast } = useToast();
  const [versions, setVersions] = React.useState<VersionRow[]>([]);
  const [hostsByVersion, setHostsByVersion] = React.useState<Record<string, HostRow[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modal state
  const [versionModal, setVersionModal] = React.useState<{ open: boolean; edit: VersionRow | null }>({
    open: false,
    edit: null,
  });
  const [hostModal, setHostModal] = React.useState<{
    open: boolean;
    edit: HostRow | null;
    versionId: string;
  }>({ open: false, edit: null, versionId: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes] = await Promise.all([
        api("GET", `/api/admin/versions?file_id=${fileId}`),
        api("GET", `/api/admin/hosts?version_id=`),
      ]);
      if (!vRes.ok) {
        setError(vRes.json?.error ?? "Gagal memuat versi.");
        setLoading(false);
        return;
      }
      const vItems = (vRes.json?.items ?? []) as VersionRow[];
      setVersions(vItems);
      // Muat host per versi.
      const map: Record<string, HostRow[]> = {};
      await Promise.all(
        vItems.map(async (v) => {
          const r = await api("GET", `/api/admin/hosts?version_id=${v.id}`);
          map[v.id] = r.ok ? ((r.json?.items ?? []) as HostRow[]) : [];
        })
      );
      setHostsByVersion(map);
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, [fileId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const submitVersion = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    const payload = buildPayload(VERSION_FIELDS, values);
    payload.file_id = fileId;
    const result = versionModal.edit
      ? await api("PATCH", `/api/admin/versions/${versionModal.edit.id}`, payload)
      : await api("POST", `/api/admin/versions`, payload);
    setSubmitting(false);
    if (result.ok) {
      toast(versionModal.edit ? "Versi diperbarui." : "Versi ditambahkan.", "success");
      setVersionModal({ open: false, edit: null });
      void load();
    } else {
      setFormError(result.json?.error ?? "Gagal menyimpan versi.");
    }
  };

  const submitHost = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    const payload = buildPayload(HOST_FIELDS, values);
    payload.file_version_id = hostModal.versionId;
    const result = hostModal.edit
      ? await api("PATCH", `/api/admin/hosts/${hostModal.edit.id}`, payload)
      : await api("POST", `/api/admin/hosts`, payload);
    setSubmitting(false);
    if (result.ok) {
      toast(hostModal.edit ? "Host diperbarui." : "Host ditambahkan.", "success");
      setHostModal({ open: false, edit: null, versionId: "" });
      void load();
    } else {
      setFormError(result.json?.error ?? "Gagal menyimpan host.");
    }
  };

  const removeVersion = async (row: VersionRow) => {
    if (!window.confirm(`Hapus versi ${row.version_label}? Host terkait ikut terhapus.`)) return;
    const r = await api("DELETE", `/api/admin/versions/${row.id}`);
    if (r.ok) {
      toast("Versi dihapus.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal menghapus.", "error");
  };

  const removeHost = async (row: HostRow) => {
    if (!window.confirm(`Hapus host ${row.name}?`)) return;
    const r = await api("DELETE", `/api/admin/hosts/${row.id}`);
    if (r.ok) {
      toast("Host dihapus.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal menghapus.", "error");
  };

  const setLatest = async (row: VersionRow) => {
    const r = await api("PATCH", `/api/admin/versions/${row.id}`, { is_latest: true });
    if (r.ok) {
      toast(`v${row.version_label} menjadi versi terbaru.`, "success");
      void load();
    } else toast(r.json?.error ?? "Gagal mengatur latest.", "error");
  };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-text-faint">
        <Link href="/admin/files" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          File
        </Link>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Versi & Host</h1>
          <p className="mt-1.5 text-sm text-text-muted">
            File: <strong className="text-text">{fileTitle}</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setVersionModal({ open: true, edit: null });
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah versi
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-12 text-text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden />
          Memuat versi…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger" role="alert">
          {error}
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-12 text-center text-sm text-text-muted">
          Belum ada versi. Klik “Tambah versi” untuk membuat riwayat versi pertama.
        </div>
      ) : (
        <div className="space-y-5">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`rounded-2xl border bg-surface p-5 ${v.is_latest ? "border-brand/50" : "border-border"}`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-text">v{v.version_label}</h2>
                {v.is_latest && (
                  <span className="inline-flex items-center rounded-full border border-brand/40 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                    <Star className="mr-1 h-3 w-3" aria-hidden />
                    Terbaru
                  </span>
                )}
                <StatusBadge value={v.status} meta={VERSION_STATUS_META} />
                <div className="ml-auto flex flex-wrap gap-2">
                  {!v.is_latest && (
                    <RowButton onClick={() => void setLatest(v)} tone="success">
                      <Star className="h-3 w-3" aria-hidden /> Jadikan latest
                    </RowButton>
                  )}
                  <RowButton
                    onClick={() => {
                      setFormError(null);
                      setVersionModal({ open: true, edit: v });
                    }}
                    tone="brand"
                  >
                    <Pencil className="h-3 w-3" aria-hidden /> Ubah
                  </RowButton>
                  <RowButton onClick={() => void removeVersion(v)} tone="danger">
                    <Trash2 className="h-3 w-3" aria-hidden /> Hapus
                  </RowButton>
                </div>
              </div>

              <dl className="grid gap-x-6 gap-y-1 text-sm text-text-muted sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-text-faint">Rilis</dt>
                  <dd>{v.released_at ? formatDate(v.released_at) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">Kompatibilitas</dt>
                  <dd>{v.compatibility ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-faint">SHA-256</dt>
                  <dd className="truncate font-mono text-xs" title={v.sha256 ?? ""}>
                    {v.sha256 ? `${v.sha256.slice(0, 16)}…` : "—"}
                  </dd>
                </div>
              </dl>
              {v.release_notes && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-text-muted">{v.release_notes}</p>
              )}

              {/* Host untuk versi ini */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                    <Link2 className="h-3.5 w-3.5" aria-hidden />
                    Host unduhan
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setHostModal({ open: true, edit: null, versionId: v.id });
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-medium text-text-muted transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <Plus className="h-3 w-3" aria-hidden />
                    Tambah host
                  </button>
                </div>
                {(hostsByVersion[v.id] ?? []).length === 0 ? (
                  <p className="text-sm text-text-faint">Belum ada host untuk versi ini.</p>
                ) : (
                  <AdminTable
                    columns={[
                      { key: "name", header: "Nama", render: (h: HostRow) => <span className="font-medium">{h.name}</span> },
                      {
                        key: "url",
                        header: "URL",
                        render: (h: HostRow) => (
                          <span className="truncate font-mono text-xs text-text-faint" title={h.url}>
                            {new URL(h.url).hostname}
                          </span>
                        ),
                      },
                      { key: "priority", header: "Prioritas", render: (h: HostRow) => h.priority },
                      {
                        key: "status",
                        header: "Status",
                        render: (h: HostRow) => (
                          <span className="flex items-center gap-1.5">
                            <StatusBadge value={h.status} meta={HOST_STATUS_META} />
                            {!h.is_active && (
                              <span className="text-[11px] text-text-faint">(nonaktif)</span>
                            )}
                          </span>
                        ),
                      },
                    ]}
                    rows={hostsByVersion[v.id] ?? []}
                    rowActions={(h: HostRow) => (
                      <>
                        <RowButton
                          onClick={() => {
                            setFormError(null);
                            setHostModal({ open: true, edit: h, versionId: v.id });
                          }}
                          tone="brand"
                        >
                          <Pencil className="h-3 w-3" aria-hidden /> Ubah
                        </RowButton>
                        <RowButton onClick={() => void removeHost(h)} tone="danger">
                          <Trash2 className="h-3 w-3" aria-hidden /> Hapus
                        </RowButton>
                      </>
                    )}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal versi */}
      <AdminFormModal
        open={versionModal.open}
        title={versionModal.edit ? `Ubah v${versionModal.edit.version_label}` : "Tambah versi"}
        fields={VERSION_FIELDS}
        initialValues={
          versionModal.edit
            ? {
                version_label: versionModal.edit.version_label,
                release_notes: versionModal.edit.release_notes ?? "",
                released_at: versionModal.edit.released_at
                  ? versionModal.edit.released_at.slice(0, 16)
                  : "",
                sha256: versionModal.edit.sha256 ?? "",
                compatibility: versionModal.edit.compatibility ?? "",
                status: versionModal.edit.status,
                is_latest: versionModal.edit.is_latest,
              }
            : undefined
        }
        onSubmit={(v) => void submitVersion(v)}
        onClose={() => setVersionModal({ open: false, edit: null })}
        submitting={submitting}
        error={formError}
      />

      {/* Modal host */}
      <AdminFormModal
        open={hostModal.open}
        title={hostModal.edit ? `Ubah host ${hostModal.edit.name}` : "Tambah host"}
        fields={HOST_FIELDS}
        initialValues={
          hostModal.edit
            ? {
                name: hostModal.edit.name,
                url: hostModal.edit.url,
                priority: String(hostModal.edit.priority),
                status: hostModal.edit.status,
                is_active: hostModal.edit.is_active,
                status_note: hostModal.edit.status_note ?? "",
              }
            : undefined
        }
        onSubmit={(v) => void submitHost(v)}
        onClose={() => setHostModal({ open: false, edit: null, versionId: "" })}
        submitting={submitting}
        error={formError}
      />
    </div>
  );
}
