"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FILE_CATEGORIES } from "@/lib/types";

const selectStyle =
  "h-10 w-full cursor-pointer rounded-xl border border-border bg-surface px-3.5 text-sm text-text transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25";

export interface DownloadFilterValues {
  q: string;
  game: string;
  category: string;
  updated: string;
  availability: string;
  gameOptions: Array<{ value: string; label: string }>;
  total: number;
}

/**
 * Bar filter katalog download — semua filter dikirim via URL (shareable,
 * back/forward bekerja). Submit otomatis saat salah satu filter berubah.
 */
export function DownloadFilters({ values }: { values: DownloadFilterValues }) {
  const router = useRouter();
  const [q, setQ] = React.useState(values.q);
  const deferredQ = React.useDeferredValue(q);

  const navigate = React.useCallback(
    (overrides: Partial<DownloadFilterValues>) => {
      const merged: DownloadFilterValues = { ...values, ...overrides };
      const params = new URLSearchParams();
      if (merged.q.trim()) params.set("q", merged.q.trim());
      if (merged.game) params.set("game", merged.game);
      if (merged.category) params.set("category", merged.category);
      if (merged.updated) params.set("updated", merged.updated);
      if (merged.availability) params.set("availability", merged.availability);
      const qs = params.toString();
      router.push(qs ? `/downloads?${qs}` : "/downloads", { scroll: false });
    },
    [router, values]
  );

  // Live search dengan debounce ringan.
  React.useEffect(() => {
    if (deferredQ.trim() === values.q.trim()) return;
    const t = window.setTimeout(() => navigate({ q: deferredQ }), 400);
    return () => window.clearTimeout(t);
  }, [deferredQ, values.q, navigate]);

  const hasFilters = Boolean(values.q || values.game || values.category || values.updated || values.availability);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SearchInput
            action="/downloads"
            placeholder="Cari nama file…"
            defaultValue={values.q}
            live
          />
        </div>
        <select
          aria-label="Filter game"
          className={cn(selectStyle, "lg:w-auto")}
          value={values.game}
          onChange={(e) => navigate({ game: e.target.value })}
        >
          <option value="">Semua game</option>
          {values.gameOptions.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter jenis file"
          className={cn(selectStyle, "lg:w-auto")}
          value={values.category}
          onChange={(e) => navigate({ category: e.target.value })}
        >
          <option value="">Semua jenis</option>
          {FILE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select
            aria-label="Filter tanggal pembaruan"
            className={cn(selectStyle, "lg:w-auto")}
            value={values.updated}
            onChange={(e) => navigate({ updated: e.target.value })}
          >
            <option value="">Kapan saja</option>
            <option value="7d">7 hari</option>
            <option value="30d">30 hari</option>
            <option value="90d">90 hari</option>
          </select>
          <select
            aria-label="Filter ketersediaan"
            className={cn(selectStyle, "lg:w-auto")}
            value={values.availability}
            onChange={(e) => navigate({ availability: e.target.value })}
          >
            <option value="">Semua status</option>
            <option value="available">Tersedia</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-xs text-text-faint">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          {values.total} file ditemukan
          {hasFilters && <span className="font-medium text-brand">· filter aktif</span>}
        </p>
        {hasFilters && (
          <button type="button" onClick={() => { setQ(""); navigate({ q: "", game: "", category: "", updated: "", availability: "" }); }}
            className={cn(buttonVariants("ghost", "sm"), "text-xs text-brand")}>
            Reset filter
          </button>
        )}
      </div>
    </div>
  );
}
