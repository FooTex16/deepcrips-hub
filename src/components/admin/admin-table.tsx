"use client";

import * as React from "react";
import { Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tabel generik admin — tiap baris menjadi kartu label→nilai (responsif).
 * Kolom didefinisikan sebagai konfigurasi; aksi baris opsional.
 */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Sembunyikan di mobile (hanya tampil desktop). */
  hideMobile?: boolean;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  emptyMessage = "Belum ada data.",
  rowActions,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  rowActions?: (row: T) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-12 text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden />
        Memuat data…
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
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/60 p-12 text-center">
        <Inbox className="h-8 w-8 text-text-faint" aria-hidden />
        <p className="text-sm text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  const showActions = Boolean(rowActions);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Header (desktop) */}
      <div className="hidden border-b border-border bg-bg-subtle px-4 py-2.5 lg:flex lg:gap-4">
        {columns.map((c) => (
          <span
            key={c.key}
            className={cn(
              "min-w-0 flex-1 text-xs font-semibold uppercase tracking-wide text-text-faint",
              c.hideMobile && "hidden lg:block"
            )}
          >
            {c.header}
          </span>
        ))}
        {showActions && <span className="w-32 shrink-0 text-right text-xs font-semibold uppercase tracking-wide text-text-faint">Aksi</span>}
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3.5 lg:flex lg:items-center lg:gap-4">
            <div className="grid min-w-0 flex-1 gap-1.5 sm:grid-cols-2 lg:flex lg:gap-4">
              {columns.map((c) => (
                <div
                  key={c.key}
                  className={cn("min-w-0 lg:flex-1", c.hideMobile && "hidden lg:block")}
                >
                  <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-text-faint lg:hidden">
                    {c.header}
                  </span>
                  <div className="min-w-0 break-words text-sm text-text">{c.render(row)}</div>
                </div>
              ))}
            </div>
            {showActions && (
              <div className="mt-2 flex flex-wrap gap-2 lg:mt-0 lg:w-32 lg:shrink-0 lg:justify-end">
                {rowActions?.(row)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tombol aksi kecil untuk baris tabel admin. */
export function RowButton({
  onClick,
  children,
  tone = "neutral",
  disabled,
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "danger" | "success";
  disabled?: boolean;
  title?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "border-border text-text-muted hover:border-border-strong hover:text-text",
    brand: "border-brand/40 text-brand hover:bg-brand-soft",
    danger: "border-danger/40 text-danger hover:bg-danger/10",
    success: "border-success/40 text-success hover:bg-success/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-7 items-center rounded-lg border px-2.5 text-xs font-medium transition-colors disabled:opacity-50",
        tones[tone]
      )}
    >
      {children}
    </button>
  );
}

/** Badge status kecil berdasar meta map. */
export function StatusBadge({
  value,
  meta,
}: {
  value: string;
  meta?: Record<string, { label: string; tone: string }>;
}) {
  const m = meta?.[value] ?? { label: value, tone: "neutral" };
  const tones: Record<string, string> = {
    neutral: "border-border bg-bg-subtle text-text-muted",
    info: "border-info/40 bg-info/10 text-info",
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    brand: "border-brand/40 bg-brand-soft text-brand",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tones[m.tone] ?? tones.neutral
      )}
    >
      {m.label}
    </span>
  );
}

/** Tombol navigasi paginasi admin sederhana. */
export function AdminPager({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text disabled:opacity-40"
      >
        Sebelumnya
      </button>
      <span className="text-sm text-text-muted">
        Halaman {page} dari {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 items-center rounded-xl border border-border px-3.5 text-sm font-medium text-text-muted transition-colors hover:border-border-strong hover:text-text disabled:opacity-40"
      >
        Berikutnya
      </button>
    </div>
  );
}
