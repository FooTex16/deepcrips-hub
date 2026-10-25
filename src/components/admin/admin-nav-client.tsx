"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  Gamepad2,
  FileDown,
  BookOpen,
  Video,
  Star,
  MessagesSquare,
  Flag,
  Vote,
  Users,
  Settings,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Ikon DIIMPOR DI SINI (komponen client) dan dirujuk lewat string — jangan
// meneruskan fungsi komponen dari Server Component (React: "Functions cannot
// be passed directly to Client Components" → error 500).
const ICONS = {
  dashboard: LayoutDashboard,
  game: Gamepad2,
  file: FileDown,
  tutorial: BookOpen,
  video: Video,
  featured: Star,
  forum: MessagesSquare,
  reports: Flag,
  requests: Vote,
  members: Users,
  settings: Settings,
  audit: ScrollText,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
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
            const Icon = ICONS[item.icon];
            const active = isActive(item);
            return (
              <li key={item.href} className="shrink-0 lg:shrink">
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group inline-flex h-10 items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 text-sm font-medium transition-all duration-150 active:scale-[0.98] lg:w-full",
                    active
                      ? "bg-brand-soft text-brand"
                      : "text-text-muted hover:bg-surface-2 hover:text-text"
                  )}
                >
                  <Icon
                    className="h-4 w-4 transition-transform duration-150 group-hover:scale-110"
                    aria-hidden
                  />
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
