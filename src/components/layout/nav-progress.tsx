"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Indikator progres navigasi di atas halaman (ala NProgress, tetapi
 * murni CSS transition — tanpa library, <1KB JS).
 *
 * - Klik link internal → bar mulai tumbuh dari 0 → 75%.
 * - pathname berubah (navigasi selesai) → bar penuh lalu memudar.
 * - Transisi state hanya dipicu di dalam callback timer (bukan sinkron
 *   di body effect) mengikuti aturan `react-hooks/set-state-in-effect`.
 * - Dihormati `prefers-reduced-motion` lewat aturan CSS global.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [state, setState] = React.useState<"idle" | "loading" | "done">("idle");
  const startedRef = React.useRef(false);
  const doneTimerRef = React.useRef<number | undefined>(undefined);
  const idleTimerRef = React.useRef<number | undefined>(undefined);

  const clearTimers = React.useCallback(() => {
    if (doneTimerRef.current !== undefined) {
      window.clearTimeout(doneTimerRef.current);
      doneTimerRef.current = undefined;
    }
    if (idleTimerRef.current !== undefined) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = undefined;
    }
  }, []);

  // Mulai bar saat ada klik pada link internal (capturing: sebelum Next.js).
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      clearTimers();
      startedRef.current = true;
      setState("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [clearTimers]);

  // pathname berubah = navigasi selesai → tutup bar (via callback timer).
  React.useEffect(() => {
    if (!startedRef.current) return;
    doneTimerRef.current = window.setTimeout(() => {
      doneTimerRef.current = undefined;
      setState("done");
      idleTimerRef.current = window.setTimeout(() => {
        idleTimerRef.current = undefined;
        startedRef.current = false;
        setState("idle");
      }, 450);
    }, 0);
    return clearTimers;
  }, [pathname, clearTimers]);

  return (
    <div aria-hidden className="nav-progress">
      <div
        className={
          state === "loading"
            ? "nav-progress__bar nav-progress__bar--loading"
            : state === "done"
              ? "nav-progress__bar nav-progress__bar--done"
              : "nav-progress__bar nav-progress__bar--idle"
        }
      />
    </div>
  );
}
