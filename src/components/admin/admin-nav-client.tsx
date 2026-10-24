"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  exact?: boolean;
}

/**
 * Navigasi admin — sidebar horizontal-scroll di mobile, vertikal di desktop.
 * Item yang membutuhkan primary_admin disembunyikan bila bukan primary admin
 * (otorisasi tetap dicek ulang di server).
 */
export function AdminNavClient({
  items,
  isPrimaryAdmin,
}: {
  items: NavItem[];
  isPrimaryAdmin: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const visible = items.filter((i) =>
    ["/admin/members", "/admin/settings"].includes(i.href) ? isPrimaryAdmin : true
  );

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <>
      {/* Toggle mobile */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-3 inline-flex h-10 w-full items-center justify-between rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text lg:hidden"
      >
        Menu Admin
        <Menu className="h-4 w-4" aria-hidden />
      </button>

      <nav
        aria-label="Navigasi admin"
        className={cn(
          "lg:block",
          open ? "block" : "hidden"
        )}
      >
        <ul className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {visible.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium transition-colors lg:w-full",
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-text-muted hover:bg-surface-2 hover:text-text"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
