"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { AdminTable, RowButton, AdminPager, type Column } from "@/components/admin/admin-table";
import { AdminFormModal, buildPayload, type FieldDef, type FormValues } from "@/components/admin/admin-form";
import { useResource } from "@/components/admin/use-resource";
import { useToast } from "@/components/ui/toast";
import { CONTENT_STATUS_META } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Halaman admin generik untuk satu resource (list + cari + filter status +
 * tambah + ubah + hapus). Dipakai games, files, tutorials, videos.
 */
export function ResourceAdmin<T extends { id: string; status?: string }>({
  endpoint,
  title,
  description,
  columns,
  fields,
  canDelete = true,
  searchPlaceholder = "Cari…",
  extraActions,
  rowToInitial,
  onSaved,
}: {
  endpoint: string;
  title: string;
  description?: string;
  columns: Array<Column<T>>;
  fields: FieldDef[];
  canDelete?: boolean;
  searchPlaceholder?: string;
  extraActions?: (row: T, reload: () => void) => React.ReactNode;
  rowToInitial?: (row: T) => Partial<FormValues>;
  onSaved?: () => void;
}) {
  const { items, count, page, totalPages, loading, error, reload, mutate } = useResource<T>(endpoint);
  const { toast } = useToast();

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const doReload = React.useCallback(
    (overrides: Record<string, string | number | undefined> = {}) => {
      void reload({ q, status, page, ...overrides });
    },
    [reload, q, status, page]
  );

  // Debounce pencarian.
  const [deferredQ, setDeferredQ] = React.useState(q);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDeferredQ(q), 400);
    return () => window.clearTimeout(t);
  }, [q]);
  React.useEffect(() => {
    void reload({ q: deferredQ, status, page: 1 });
  }, [reload, deferredQ, status]);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setFormError(null);
    setModalOpen(true);
  };

  const submit = async (values: FormValues) => {
    setSubmitting(true);
    setFormError(null);
    const payload = buildPayload(fields, values);
    const result = editing
      ? await mutate("PATCH", payload, editing.id)
      : await mutate("POST", payload);
    setSubmitting(false);
    if (result.ok) {
      toast(editing ? `${title} diperbarui.` : `${title} ditambahkan.`, "success");
      setModalOpen(false);
      onSaved?.();
      doReload();
    } else {
      setFormError(result.error ?? "Gagal menyimpan.");
    }
  };

  const remove = async (row: T) => {
    if (!window.confirm("Hapus permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    setDeletingId(row.id);
    const result = await mutate("DELETE", undefined, row.id);
    setDeletingId(null);
    if (result.ok) {
      toast(`${title} dihapus.`, "success");
      doReload();
    } else {
      toast(result.error ?? "Gagal menghapus.", "error");
    }
  };

  const initial = editing ? (rowToInitial ? rowToInitial(editing) : (editing as unknown as FormValues)) : undefined;

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-text-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah
        </button>
      </header>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Cari"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter status">
          <FilterChip active={!status} onClick={() => setStatus("")}>
            Semua
          </FilterChip>
          {Object.entries(CONTENT_STATUS_META).map(([key, meta]) => (
            <FilterChip key={key} active={status === key} onClick={() => setStatus(key)}>
              {meta.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs text-text-faint">{count} data</p>

      <AdminTable
        columns={columns}
        rows={items}
        loading={loading}
        error={error}
        emptyMessage={q || status ? "Tidak ada data yang cocok." : "Belum ada data."}
        rowActions={(row) => (
          <>
            <RowButton onClick={() => openEdit(row)} tone="brand">
              <Pencil className="h-3 w-3" aria-hidden /> Ubah
            </RowButton>
            {extraActions?.(row, doReload)}
            {canDelete && (
              <RowButton onClick={() => void remove(row)} tone="danger" disabled={deletingId === row.id}>
                <Trash2 className="h-3 w-3" aria-hidden /> Hapus
              </RowButton>
            )}
          </>
        )}
      />

      <AdminPager page={page} totalPages={totalPages} onPage={(p) => doReload({ page: p })} />

      <AdminFormModal
        open={modalOpen}
        title={editing ? `Ubah ${title}` : `Tambah ${title}`}
        fields={fields}
        initialValues={initial}
        onSubmit={(v) => void submit(v)}
        onClose={() => setModalOpen(false)}
        submitting={submitting}
        error={formError}
      />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand/50 bg-brand-soft text-brand"
          : "border-border text-text-muted hover:border-border-strong hover:text-text"
      )}
    >
      {children}
    </button>
  );
}
