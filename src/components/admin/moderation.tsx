"use client";

import * as React from "react";
import Link from "next/link";
import { EyeOff, Eye, Lock, Unlock, Flag, Loader2 } from "lucide-react";
import { AdminTable, RowButton, StatusBadge } from "@/components/admin/admin-table";
import { useToast } from "@/components/ui/toast";
import { timeAgo, truncate } from "@/lib/utils";

interface TopicRow {
  id: string;
  title: string;
  body: string;
  hidden: boolean;
  locked: boolean;
  comment_count: number;
  created_at: string;
  author: { id: string; display_name: string } | null;
}

interface CommentRow {
  id: string;
  body: string;
  hidden: boolean;
  created_at: string;
  author: { id: string; display_name: string } | null;
  topic: { id: string; title: string } | null;
}

interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { id: string; display_name: string } | null;
  topic: { id: string; title: string; hidden: boolean; locked: boolean } | null;
  comment: { id: string; body: string; hidden: boolean } | null;
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

/** Tab navigasi sederhana. */
function Tabs({
  active,
  onChange,
  items,
}: {
  active: string;
  onChange: (v: string) => void;
  items: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="mb-5 flex gap-1.5">
      {items.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => onChange(i.id)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            active === i.id
              ? "bg-brand-soft text-brand"
              : "text-text-muted hover:bg-surface-2 hover:text-text"
          }`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/** ===== Forum (topik + komentar tersembunyi) ===== */
export function ForumModeration() {
  const { toast } = useToast();
  const [tab, setTab] = React.useState("topics");
  const [topics, setTopics] = React.useState<TopicRow[]>([]);
  const [comments, setComments] = React.useState<CommentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, cRes] = await Promise.all([
        api("GET", "/api/admin/moderation/topics?limit=50"),
        api("GET", "/api/admin/moderation/comments?limit=50"),
      ]);
      setTopics(tRes.ok ? ((tRes.json?.items ?? []) as TopicRow[]) : []);
      setComments(cRes.ok ? ((cRes.json?.items ?? []) as CommentRow[]) : []);
      if (!tRes.ok && !cRes.ok) setError(tRes.json?.error ?? "Gagal memuat data moderasi.");
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (
    targetType: "topic" | "comment",
    targetId: string,
    action: "hide" | "unhide" | "lock" | "unlock"
  ) => {
    if (action === "hide" && !window.confirm("Sembunyikan konten ini dari publik?")) return;
    const r = await api("POST", "/api/forum/moderate", {
      target_type: targetType,
      target_id: targetId,
      action,
    });
    if (r.ok) {
      toast("Tindakan moderasi diterapkan.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal.", "error");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-12 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden />
        Memuat…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div>
      <Tabs
        active={tab}
        onChange={setTab}
        items={[
          { id: "topics", label: `Topik (${topics.length})` },
          { id: "comments", label: `Komentar tersembunyi (${comments.length})` },
        ]}
      />

      {tab === "topics" ? (
        <AdminTable<TopicRow>
          columns={[
            {
              key: "title",
              header: "Judul",
              render: (r) => (
                <div>
                  <Link href={`/forum/${r.id}`} className="font-medium text-brand hover:underline">
                    {truncate(r.title, 60)}
                  </Link>
                  <p className="text-xs text-text-faint">
                    {r.author?.display_name ?? "—"} · {timeAgo(r.created_at)} · {r.comment_count} komentar
                  </p>
                </div>
              ),
            },
            {
              key: "flags",
              header: "Status",
              render: (r) => (
                <div className="flex flex-wrap gap-1.5">
                  {r.hidden && <StatusBadge value="hidden" meta={{ hidden: { label: "Tersembunyi", tone: "danger" } }} />}
                  {r.locked && <StatusBadge value="locked" meta={{ locked: { label: "Terkunci", tone: "warning" } }} />}
                  {!r.hidden && !r.locked && (
                    <StatusBadge value="ok" meta={{ ok: { label: "Normal", tone: "success" } }} />
                  )}
                </div>
              ),
            },
          ]}
          rows={topics}
          emptyMessage="Tidak ada topik."
          rowActions={(r) => (
            <>
              <RowButton onClick={() => void moderate("topic", r.id, r.hidden ? "unhide" : "hide")} tone={r.hidden ? "success" : "danger"}>
                {r.hidden ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
                {r.hidden ? "Tampilkan" : "Sembunyikan"}
              </RowButton>
              <RowButton onClick={() => void moderate("topic", r.id, r.locked ? "unlock" : "lock")} tone={r.locked ? "success" : "neutral"}>
                {r.locked ? <Unlock className="h-3 w-3" aria-hidden /> : <Lock className="h-3 w-3" aria-hidden />}
                {r.locked ? "Buka" : "Kunci"}
              </RowButton>
            </>
          )}
        />
      ) : (
        <AdminTable<CommentRow>
          columns={[
            {
              key: "body",
              header: "Isi komentar",
              render: (r) => (
                <div>
                  <p className="line-clamp-2">{truncate(r.body, 120)}</p>
                  <p className="text-xs text-text-faint">
                    {r.author?.display_name ?? "—"} · {timeAgo(r.created_at)}
                    {r.topic && <> · di “{truncate(r.topic.title, 40)}”</>}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) =>
                r.hidden ? (
                  <StatusBadge value="hidden" meta={{ hidden: { label: "Tersembunyi", tone: "danger" } }} />
                ) : (
                  <StatusBadge value="ok" meta={{ ok: { label: "Normal", tone: "success" } }} />
                ),
            },
          ]}
          rows={comments}
          emptyMessage="Tidak ada komentar tersembunyi."
          rowActions={(r) => (
            <RowButton onClick={() => void moderate("comment", r.id, r.hidden ? "unhide" : "hide")} tone={r.hidden ? "success" : "danger"}>
              {r.hidden ? <Eye className="h-3 w-3" aria-hidden /> : <EyeOff className="h-3 w-3" aria-hidden />}
              {r.hidden ? "Tampilkan" : "Sembunyikan"}
            </RowButton>
          )}
        />
      )}
    </div>
  );
}

/** ===== Laporan ===== */
export function ReportsManager() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("open");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api("GET", `/api/admin/reports?limit=50&status=${filter}`);
      if (!r.ok) {
        setError(r.json?.error ?? "Gagal memuat laporan.");
        setLoading(false);
        return;
      }
      setRows((r.json?.items ?? []) as ReportRow[]);
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, [filter]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string, status: "resolved" | "dismissed", hide: boolean) => {
    const confirmMsg =
      status === "resolved"
        ? hide
          ? "Tandai selesai DAN sembunyikan konten terlapor?"
          : "Tandai laporan selesai (konten tetap tampil)?"
        : "Tolak laporan ini?";
    if (!window.confirm(confirmMsg)) return;
    const r = await api("PATCH", `/api/admin/reports/${id}`, { status, hide_target: hide });
    if (r.ok) {
      toast(status === "resolved" ? "Laporan diselesaikan." : "Laporan ditolak.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal.", "error");
  };

  return (
    <div>
      <div className="mb-5 flex gap-1.5">
        {[
          { id: "open", label: "Terbuka" },
          { id: "resolved", label: "Selesai" },
          { id: "dismissed", label: "Ditolak" },
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

      <AdminTable<ReportRow>
        columns={[
          {
            key: "target",
            header: "Konten terlapor",
            render: (r) => (
              <div>
                {r.topic ? (
                  <Link href={`/forum/${r.topic.id}`} className="font-medium text-brand hover:underline">
                    Topik: {truncate(r.topic.title, 50)}
                  </Link>
                ) : r.comment ? (
                  <p className="font-medium">Komentar: {truncate(r.comment.body, 50)}</p>
                ) : (
                  <p className="text-text-faint">—</p>
                )}
                <p className="text-xs text-text-faint">
                  {r.reporter?.display_name ?? "—"} melaporkan · {timeAgo(r.created_at)}
                </p>
              </div>
            ),
          },
          { key: "reason", header: "Alasan", render: (r) => <span className="text-sm">{r.reason}</span> },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <StatusBadge
                value={r.status}
                meta={{
                  open: { label: "Terbuka", tone: "warning" },
                  resolved: { label: "Selesai", tone: "success" },
                  dismissed: { label: "Ditolak", tone: "neutral" },
                }}
              />
            ),
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage={filter === "open" ? "Tidak ada laporan terbuka. 🎉" : "Tidak ada laporan."}
        rowActions={(r) =>
          r.status === "open" ? (
            <>
              <RowButton onClick={() => void resolve(r.id, "resolved", true)} tone="danger">
                <Flag className="h-3 w-3" aria-hidden /> Sembunyikan
              </RowButton>
              <RowButton onClick={() => void resolve(r.id, "resolved", false)} tone="success">
                Selesai
              </RowButton>
              <RowButton onClick={() => void resolve(r.id, "dismissed", false)} tone="neutral">
                Tolak
              </RowButton>
            </>
          ) : null
        }
      />
    </div>
  );
}
