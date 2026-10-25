"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search as SearchIcon, LogOut, User as UserIcon, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

import { Avatar } from "@/components/ui/avatar";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { useAuth } from "@/components/providers/auth-provider";

const NAV_LINKS = [
  { href: "/games", label: "Game" },
  { href: "/downloads", label: "Download" },
  { href: "/tutorials", label: "Tutorial" },
  { href: "/videos", label: "Video" },
  { href: "/forum", label: "Forum" },
  { href: "/requests", label: "Permintaan" },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { user, profile, isStaff, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Tutup menu mobile saat pindah halaman.
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <BrandLogo />

        {/* Navigasi desktop */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(pathname, link.href) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                isActive(pathname, link.href)
                  ? "bg-surface-2 text-text"
                  : "text-text-muted hover:bg-surface-2/70 hover:text-text"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Pencarian global"
            className={cn(buttonVariants("ghost", "icon"), "hidden sm:inline-flex")}
          >
            <SearchIcon className="h-[18px] w-[18px]" aria-hidden />
          </Link>
          <ThemeToggle />

          {loading ? (
            <span className="inline-flex h-10 w-10 items-center justify-center" aria-hidden>
              <Loader2 className="h-4 w-4 animate-spin text-text-faint" />
            </span>
          ) : user ? (
            <Dropdown
              label="Menu akun"
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label="Menu akun"
                  className="rounded-full transition-transform duration-150 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Avatar src={profile?.avatar_url} name={profile?.display_name ?? "Anggota"} size="sm" />
                </button>
              )}
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-semibold text-text">{profile?.display_name ?? "Anggota"}</p>
                <p className="text-2xs text-text-faint">Anggota DeepCrips Hub</p>
              </div>
              <DropdownItem href="/profile">
                <UserIcon className="h-4 w-4" aria-hidden />
                Profil
              </DropdownItem>
              {isStaff && (
                <DropdownItem href="/admin">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Dashboard Admin
                </DropdownItem>
              )}
              <DropdownItem danger onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" aria-hidden />
                Keluar
              </DropdownItem>
            </Dropdown>
          ) : (
            <Link href="/login" className={buttonVariants("primary", "sm")}>
              Masuk
            </Link>
          )}

          {/* Tombol menu mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            className={cn(buttonVariants("ghost", "icon"), "lg:hidden")}
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Panel navigasi mobile */}
      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Navigasi utama mobile"
          className="animate-fade-up border-t border-border bg-bg lg:hidden"
        >
          <div className="container flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(pathname, link.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive(pathname, link.href)
                    ? "bg-surface-2 text-text"
                    : "text-text-muted hover:bg-surface-2/70 hover:text-text"
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/search" className="rounded-xl px-4 py-3 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text">
              Pencarian
            </Link>
            {!user && !loading && (
              <Link href="/login" className={cn(buttonVariants("primary", "md"), "mt-2")}>
                Masuk dengan Google
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
