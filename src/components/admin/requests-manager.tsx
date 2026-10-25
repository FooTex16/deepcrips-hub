"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Clock, ListTodo, ImageIcon, Paperclip, FileText, Code2 } from "lucide-react";
import { AdminTable, RowButton, StatusBadge } from "@/components/admin/admin-table";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { REQUEST_STATUS_META, type RequestAttachment } from "@/lib/types";
import { timeAgo, truncate, formatBytes } from "@/lib/utils";

interface RequestRow {
  id: string;
  title: string;
  request_type: string;
  description: string;
  script_text: string | null;
  screenshots: string[];
  attachments: RequestAttachment[];
  status: string;
  vote_count: number;
  admin_notes: string | null;
  created_at: string;
  requester: { id: string; display_name: string } | null;
}

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

const STATUS_FLOW = ["in_review", "planned", "completed", "rejected"] as const;

export function RequestsManager() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<RequestRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("pending");
  const [notesEdit, setNotesEdit] = React.useState<{ id: string; notes: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [detail, setDetail] = React.useState<RequestRow | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter ? `&status=${filter}` : "";
      const r = await api("GET", `/api/admin/requests?limit=50${qs}`);
      if (!r.ok) {
        setError(r.json?.error ?? "Gagal memuat permintaan.");
        setLoading(false);
        return;
      }
      setRows((r.json?.items ?? []) as RequestRow[]);
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string, notes?: string) => {
    setSaving(true);
    const r = await api("PATCH", `/api/admin/requests/${id}`, { status, admin_notes: notes ?? null });
    setSaving(false);
    if (r.ok) {
      toast(`Status diubah ke “${REQUEST_STATUS_META[status as keyof typeof REQUEST_STATUS_META]?.label ?? status}”.`, "success");
      void load();
    } else toast(r.json?.error ?? "Gagal memperbarui.", "error");
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {[
          { id: "pending", label: "Menunggu" },
          { id: "in_review", label: "Ditinjau" },
          { id: "planned", label: "Direncanakan" },
          { id: "completed", label: "Selesai" },
          { id: "rejected", label: "Ditolak" },
          { id: "", label: "Semua" },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-brand-soft text-brand"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminTable<RequestRow>
        columns={[
          {
            key: "title",
            header: "Permintaan",
            render: (r) => (
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-text-faint">
                  {r.requester?.display_name ?? "—"} · {r.request_type} · {r.vote_count} suara ·{" "}
                  {timeAgo(r.created_at)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-text-muted">{truncate(r.description, 120)}</p>
                {(r.script_text ||
                  (r.screenshots?.length ?? 0) > 0 ||
                  (r.attachments?.length ?? 0) > 0) && (
                  <p className="mt-1 flex flex-wrap gap-2.5 text-[11px] text-text-faint">
                    {r.script_text && (
                      <span className="inline-flex items-center gap-1">
                        <Code2 className="h-3 w-3" aria-hidden /> script
                      </span>
                    )}
                    {(r.screenshots?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" aria-hidden /> {r.screenshots.length} screenshot
                      </span>
                    )}
                    {(r.attachments?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Paperclip className="h-3 w-3" aria-hidden /> {r.attachments.length} file
                      </span>
                    )}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge value={r.status} meta={REQUEST_STATUS_META} />,
          },
          {
            key: "notes",
            header: "Catatan admin",
            render: (r) =>
              notesEdit?.id === r.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={notesEdit.notes}
                    onChange={(e) => setNotesEdit({ id: r.id, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-bg-subtle px-3 py-2 text-xs text-text focus:border-brand focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <RowButton onClick={() => void updateStatus(r.id, r.status, notesEdit.notes)} tone="success" disabled={saving}>
                      Simpan catatan
                    </RowButton>
                    <RowButton onClick={() => setNotesEdit(null)} tone="neutral">
                      Batal
                    </RowButton>
                  </div>
                </div>
              ) : (
                <p className="line-clamp-2 text-xs text-text-muted">
                  {r.admin_notes ?? <span className="text-text-faint">—</span>}
                </p>
              ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage={filter === "pending" ? "Tidak ada permintaan menunggu. 🎉" : "Tidak ada permintaan."}
        rowActions={(r) => (
          <>
            {(r.script_text ||
              (r.screenshots?.length ?? 0) > 0 ||
              (r.attachments?.length ?? 0) > 0) && (
              <RowButton onClick={() => setDetail(r)} tone="brand">
                Tinjau lampiran
              </RowButton>
            )}
            {STATUS_FLOW.filter((s) => s !== r.status).map((s) => (
              <RowButton
                key={s}
                onClick={() => void updateStatus(r.id, s)}
                tone={s === "completed" ? "success" : s === "rejected" ? "danger" : "neutral"}
                disabled={saving}
              >
                {s === "completed" ? (
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                ) : s === "rejected" ? (
                  <XCircle className="h-3 w-3" aria-hidden />
                ) : s === "planned" ? (
                  <ListTodo className="h-3 w-3" aria-hidden />
                ) : (
                  <Clock className="h-3 w-3" aria-hidden />
                )}
                {REQUEST_STATUS_META[s].label}
              </RowButton>
            ))}
            <RowButton onClick={() => setNotesEdit({ id: r.id, notes: r.admin_notes ?? "" })} tone="brand">
              Catatan
            </RowButton>
          </>
        )}
      />

      {/* Tinjauan lampiran lengkap: deskripsi, script, screenshot, file */}
      <Dialog
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "Tinjauan lampiran"}
        description={
          detail
            ? `${detail.requester?.display_name ?? "—"} · ${timeAgo(detail.created_at)} · ${detail.request_type}`
            : undefined
        }
        className="max-w-2xl"
      >
        {detail && (
          <div className="space-y-5">
            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                Deskripsi lengkap
              </h3>
              <p className="whitespace-pre-wrap rounded-xl border border-border bg-bg-subtle p-3.5 text-sm leading-relaxed text-text-muted">
                {detail.description}
              </p>
            </section>

            {detail.script_text && (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                  <Code2 className="h-3.5 w-3.5" aria-hidden /> Script / teks
                </h3>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-bg-subtle p-3.5 font-mono text-xs leading-relaxed text-text-muted">
                  {detail.script_text}
                </pre>
              </section>
            )}

            {(detail.screenshots?.length ?? 0) > 0 && (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden /> Screenshot preview ({detail.screenshots.length})
                </h3>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {detail.screenshots.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-border"
                      title="Buka ukuran penuh"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail Storage */}
                      <img
                        src={url}
                        alt={`Screenshot ${i + 1}`}
                        loading="lazy"
                        className="aspect-video w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {(detail.attachments?.length ?? 0) > 0 && (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-faint">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden /> File lampiran ({detail.attachments.length})
                </h3>
                <ul className="space-y-1.5">
                  {detail.attachments.map((a) => (
                    <li key={a.url}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-subtle px-3 py-2 text-sm transition-colors hover:border-brand/40"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-text">{a.name}</span>
                        <span className="text-xs text-text-faint">{formatBytes(a.size)}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}
