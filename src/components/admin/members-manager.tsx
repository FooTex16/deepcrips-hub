"use client";

import * as React from "react";
import { Search, ShieldCheck, Check, Settings2, Loader2 } from "lucide-react";
import { AdminTable, AdminPager } from "@/components/admin/admin-table";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { cn, formatDate, truncate } from "@/lib/utils";

interface MemberRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  roles: Array<{ role: string }> | null;
}

const ROLE_LABELS: Record<string, string> = {
  primary_admin: "Admin Utama",
  content_admin: "Admin Konten",
  staff: "Moderator",
};

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function MembersManager() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<MemberRow[]>([]);
  const [count, setCount] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (pageOverride?: number) => {
      setLoading(true);
      setError(null);
      try {
        const p = pageOverride ?? page;
        const r = await api("GET", `/api/admin/members?limit=25&page=${p}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
        if (!r.ok) {
          setError(r.json?.error ?? "Gagal memuat anggota.");
          setLoading(false);
          return;
        }
        setRows((r.json?.items ?? []) as MemberRow[]);
        setCount(r.json?.count ?? 0);
        setPage(r.json?.page ?? 1);
        setTotalPages(r.json?.totalPages ?? 1);
      } catch {
        setError("Jaringan bermasalah.");
      }
      setLoading(false);
    },
    [page, q]
  );

  const [deferredQ, setDeferredQ] = React.useState(q);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDeferredQ(q), 400);
    return () => window.clearTimeout(t);
  }, [q]);
  React.useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredQ]);

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (busyId) return;
    const action = has ? "revoke" : "grant";
    const msg = has
      ? `Cabut peran “${ROLE_LABELS[role] ?? role}” dari anggota ini?`
      : `Berikan peran “${ROLE_LABELS[role] ?? role}” ke anggota ini?`;
    if (!window.confirm(msg)) return;
    setBusyId(userId);
    const r = await api("PATCH", "/api/admin/members/role", { user_id: userId, role, action });
    setBusyId(null);
    if (r.ok) {
      toast(action === "grant" ? "Peran diberikan." : "Peran dicabut.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal memperbarui peran.", "error");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama tampilan…"
            aria-label="Cari anggota"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </div>
        <p className="text-xs text-text-faint">{count} anggota</p>
      </div>

      <p className="mb-3 rounded-xl border border-info/30 bg-info/5 px-4 py-2.5 text-xs text-text-muted">
        Email anggota tidak pernah ditampilkan atau disimpan di frontend. Peran dikelola di sini dan
        diverifikasi ulang di server setiap aksi.
      </p>

      <AdminTable<MemberRow>
        columns={[
          {
            key: "name",
            header: "Anggota",
            render: (r) => (
              <div className="flex items-center gap-3">
                <Avatar src={r.avatar_url} name={r.display_name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{truncate(r.display_name, 40)}</p>
                  <p className="text-xs text-text-faint">Bergabung {formatDate(r.created_at)}</p>
                </div>
              </div>
            ),
          },
          {
            key: "roles",
            header: "Peran",
            render: (r) => {
              const roles = (r.roles ?? []).map((x) => x.role);
              if (roles.length === 0) return <span className="text-xs text-text-faint">Anggota</span>;
              return (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand"
                    >
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      {ROLE_LABELS[role] ?? role}
                    </span>
                  ))}
                </div>
              );
            },
          },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage="Belum ada anggota untuk ditampilkan."
        rowActions={(r) => {
          const roles = (r.roles ?? []).map((x) => x.role);
          return (
            <Dropdown
              label={`Kelola peran ${r.display_name}`}
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  disabled={busyId === r.id}
                  className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border px-2.5 text-xs font-medium text-text-muted transition-all duration-150 hover:border-brand/40 hover:bg-brand-soft hover:text-brand active:scale-95 disabled:opacity-50"
                >
                  {busyId === r.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : (
                    <Settings2 className="h-3 w-3" aria-hidden />
                  )}
                  Kelola
                </button>
              )}
            >
              {(["staff", "content_admin", "primary_admin"] as const).map((role) => {
                const has = roles.includes(role);
                return (
                  <DropdownItem key={role} onClick={() => void toggleRole(r.id, role, has)}>
                    <span
                      aria-hidden
                      className={cn(
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        has ? "border-brand bg-brand text-brand-fg" : "border-border-strong"
                      )}
                    >
                      {has ? <Check className="h-3 w-3" /> : null}
                    </span>
                    <span className={has ? "font-semibold text-text" : undefined}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="ml-auto text-2xs text-text-faint">{has ? "aktif" : "beri"}</span>
                  </DropdownItem>
                );
              })}
            </Dropdown>
          );
        }}
      />

      <AdminPager page={page} totalPages={totalPages} onPage={(p) => void load(p)} />
    </div>
  );
}
