"use client";

import { cn } from "@/lib/utils";

/**
 * Latar gradien bergerak (loop) — murni CSS keyframes + transform
 * (GPU-friendly), hormati prefers-reduced-motion lewat aturan global.
 *
 * Pemakaian: bungkus konten dengan `relative isolate` dan pasang
 * `<AmbientBackground />` sebagai anak pertama.
 */
export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("dc-ambient -z-10", className)}>
      <span className="dc-orb dc-orb--a" />
      <span className="dc-orb dc-orb--b" />
      <span className="dc-orb dc-orb--c" />
      <span className="dc-orb dc-orb--d" />
    </div>
  );
}
