"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownProps {
  /** Tombol pemicu — terima props ref & onClick dari renderer. */
  trigger: (props: {
    ref: React.Ref<HTMLButtonElement>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
  }) => React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
  label?: string;
}

/** Dropdown sederhana: tutup saat klik di luar / ESC, tanpa library. */
export function Dropdown({ trigger, children, align = "right", className, label }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [openUp, setOpenUp] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => {
          if (!open && wrapperRef.current) {
            // Balik menu ke atas bila ruang di bawah trigger sempit
            // (mis. baris terakhir tabel) agar tidak terpotong.
            const rect = wrapperRef.current.getBoundingClientRect();
            setOpenUp(rect.bottom + 260 > window.innerHeight);
          }
          setOpen((v) => !v);
        },
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })}
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "absolute z-40 min-w-48 animate-scale-in overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-pop",
            openUp ? "bottom-full mb-2" : "mt-2",
            align === "right" ? "right-0" : "left-0",
            className
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  href,
  onClick,
  children,
  danger = false,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const className = cn(
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
    danger ? "text-danger hover:bg-danger/10" : "text-text-muted hover:bg-surface-2 hover:text-text"
  );
  if (href) {
    return (
      <a href={href} className={className} role="menuitem">
        {children}
      </a>
    );
  }
  return (
    <button type="button" role="menuitem" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
