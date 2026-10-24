"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  defaultValue?: string;
  action?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Jika true, navigasi saat debounce (untuk live search). */
  live?: boolean;
  name?: string;
}

/**
 * Input pencarian yang mensubmit via GET (berfungsi tanpa JS, ramah URL).
 * Opsional mode live dengan debounce ringan.
 */
export function SearchInput({
  defaultValue = "",
  action = "/search",
  placeholder = "Cari game, file, tutorial, video…",
  className,
  autoFocus,
  live = false,
  name = "q",
}: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    if (!live) return;
    const trimmed = value.trim();
    if (trimmed === defaultValue.trim()) return;
    const t = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (trimmed) params.set(name, trimmed);
      router.push(trimmed ? `${action}?${params}` : action);
    }, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, live]);

  return (
    <form
      action={action}
      method="get"
      role="search"
      className={cn("relative w-full", className)}
      onSubmit={(e) => {
        if (!live) return; // biarkan form GET bekerja tanpa JS
        e.preventDefault();
        const params = new URLSearchParams();
        const trimmed = value.trim();
        if (trimmed) params.set(name, trimmed);
        router.push(trimmed ? `${action}?${params}` : action);
      }}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" aria-hidden />
      <input
        type="search"
        name={name}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Pencarian"
        className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-text placeholder:text-text-faint transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
          }}
          aria-label="Bersihkan pencarian"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-faint transition-colors hover:text-text"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </form>
  );
}
