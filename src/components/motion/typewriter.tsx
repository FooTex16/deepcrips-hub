"use client";

import * as React from "react";

/**
 * Animasi ketik (typewriter) untuk daftar frase yang bergantian.
 *
 * - Timer + setState hanya di dalam callback (aman untuk aturan lint
 *   set-state-in-effect, tanpa library).
 * - prefers-reduced-motion → teks ditampilkan statis (frase pertama).
 * - Aksesibilitas: teks statis untuk pembaca layar + span animasi
 *   disembunyikan dari aksesibilitas.
 */
export function Typewriter({
  phrases,
  className,
  srText,
  typeMs = 55,
  holdMs = 2200,
  eraseMs = 22,
}: {
  phrases: string[];
  className?: string;
  srText?: string;
  typeMs?: number;
  holdMs?: number;
  eraseMs?: number;
}) {
  const phrasesKey = phrases.join("\u0000");
  const safe = React.useMemo(
    () => phrasesKey.split("\u0000").filter((p) => p.trim() !== "").slice(0, 6),
    [phrasesKey]
  );

  // Default false = sama dengan render server → hydrasi cocok. Preferensi
  // dipindai SETELAH mount (lewat timer, agar tidak melanggar aturan lint
  // set-state-in-effect) lalu dikirim ulang sebagai update biasa.
  const [reduced, setReduced] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [len, setLen] = React.useState(0);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    const timer = setTimeout(sync, 0);
    mq.addEventListener("change", sync);
    return () => {
      clearTimeout(timer);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const count = safe.length;
  React.useEffect(() => {
    if (reduced || count === 0) return;
    const idx = index % count;
    const full = safe[idx] ?? "";
    let char = 0;
    let phase: "type" | "hold" | "erase" = "type";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (phase === "type") {
        char += 1;
        setLen(char);
        if (char >= full.length) {
          phase = "hold";
          timer = setTimeout(tick, holdMs);
          return;
        }
        timer = setTimeout(tick, typeMs);
      } else if (phase === "hold") {
        phase = "erase";
        timer = setTimeout(tick, eraseMs);
      } else {
        char -= 1;
        setLen(char);
        if (char <= 0) {
          setIndex((i) => (i + 1) % count);
          return;
        }
        timer = setTimeout(tick, eraseMs);
      }
    };

    timer = setTimeout(tick, typeMs);
    return () => clearTimeout(timer);
  }, [safe, count, index, reduced, typeMs, holdMs, eraseMs]);

  const staticText = safe[0] ?? "";
  const display = reduced
    ? staticText
    : (safe[index % Math.max(count, 1)] ?? "").slice(0, len);

  if (count === 0) return null;

  return (
    <span className={className}>
      {/* Teks statis untuk pembaca layar; animasi disembunyikan dari SR. */}
      <span className="sr-only">{srText ?? staticText}</span>
      <span aria-hidden="true">
        {display}
        {!reduced && display.length > 0 ? <span className="tw-caret">▌</span> : null}
      </span>
    </span>
  );
}
