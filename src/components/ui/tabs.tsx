import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * Tab berbasis URL (server-friendly): setiap tab adalah tautan yang memperbarui
 * query string, sehingga tetap bisa di-share, di-back, dan di-crawl.
 */
export interface TabItem {
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1 scrollbar-none",
        className
      )}
    >
      {items.map((tab) => (
        <Link
          key={tab.href}
          role="tab"
          aria-selected={tab.active}
          href={tab.href}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition-colors",
            tab.active
              ? "bg-brand text-brand-fg shadow-sm"
              : "text-text-muted hover:bg-surface-2 hover:text-text"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "rounded-full px-1.5 text-2xs tabular-nums",
                tab.active ? "bg-brand-fg/20" : "bg-surface-2 text-text-faint"
              )}
            >
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/** Tab client untuk form/filter lokal (tanpa navigasi). */
export interface LocalTabItem {
  id: string;
  label: string;
}

export function LocalTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: LocalTabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((t) => t.id === value);
    if (idx < 0) return;
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else return;
    e.preventDefault();
    const nextId = items[next]!.id;
    onChange(nextId);
    refs.current[nextId]?.focus();
  };

  return (
    <div role="tablist" className={cn("flex gap-1 rounded-xl border border-border bg-surface p-1", className)}>
      {items.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => {
            refs.current[tab.id] = el;
          }}
          role="tab"
          type="button"
          aria-selected={tab.id === value}
          tabIndex={tab.id === value ? 0 : -1}
          onKeyDown={onKeyDown}
          onClick={() => onChange(tab.id)}
          className={cn(
            "h-9 rounded-lg px-3.5 text-sm font-medium transition-colors",
            tab.id === value ? "bg-brand text-brand-fg shadow-sm" : "text-text-muted hover:bg-surface-2 hover:text-text"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Re-export untuk konsistensi import. */
export { buttonVariants };
