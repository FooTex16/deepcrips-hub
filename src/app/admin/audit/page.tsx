import { Section } from "@/components/layout/section";
import { createClient } from "@/lib/supabase/server";
import { ConfigMissingState } from "@/components/ui/states";
import { formatDate } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

interface AuditRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  let rows: AuditRow[] = [];
  let total = 0;
  let ready = true;
  try {
    const supabase = await createClient();
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    rows = (data ?? []) as AuditRow[];
    total = count ?? 0;
  } catch {
    ready = false;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const qs = (p: number) => `/admin/audit?page=${p}`;

  return (
    <Section className="py-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Log Audit</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-text-muted">
          Rekaman tindakan sensitif: penerbitan konten, perubahan host, perubahan peran, moderasi, dan
          pengaturan. Ditulis oleh server (service role) — tidak dapat dipalsukan dari klien.
        </p>
      </header>

      {!ready ? (
        <ConfigMissingState feature="Log audit" />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/60 p-12 text-center">
          <ScrollText className="h-8 w-8 text-text-faint" aria-hidden />
          <p className="text-sm text-text-muted">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <code className="rounded bg-bg-subtle px-1.5 py-0.5 text-xs font-medium text-brand">
                    {row.action}
                  </code>
                  <span className="text-text-faint">
                    {row.entity_type}
                    {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}…` : ""}
                  </span>
                  <span className="ml-auto text-xs text-text-faint">{formatDate(row.created_at)}</span>
                </div>
                {Object.keys(row.metadata ?? {}).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded bg-bg-subtle p-2 text-[11px] leading-relaxed text-text-faint">
                    {JSON.stringify(row.metadata, null, 1)}
                  </pre>
                )}
                <p className="mt-1.5 text-[11px] text-text-faint">
                  Actor: {row.actor_id ? `${row.actor_id.slice(0, 8)}…` : "sistem"}
                </p>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-between" aria-label="Paginasi audit">
              <a
                href={page > 1 ? qs(page - 1) : "#"}
                aria-disabled={page <= 1}
                className={`inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm font-medium ${
                  page > 1 ? "text-text-muted hover:border-border-strong hover:text-text" : "pointer-events-none opacity-40"
                }`}
              >
                Sebelumnya
              </a>
              <span className="text-sm text-text-muted">
                Halaman {page} dari {totalPages}
              </span>
              <a
                href={page < totalPages ? qs(page + 1) : "#"}
                aria-disabled={page >= totalPages}
                className={`inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm font-medium ${
                  page < totalPages ? "text-text-muted hover:border-border-strong hover:text-text" : "pointer-events-none opacity-40"
                }`}
              >
                Berikutnya
              </a>
            </nav>
          )}
        </>
      )}

      <p className="mt-6 text-xs text-text-faint">
        Total {total} entri. Log bersifat append-only (tidak ada endpoint hapus).
      </p>
    </Section>
  );
}
