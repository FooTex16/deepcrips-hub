"use client";

import * as React from "react";

/** Karacak acak bergaya "enkripsi" (hex + simbol). */
const POOL = "0123456789ABCDEF#$%&*<>/\\[]=";

/**
 * Animasi teks terdekripsi: setiap frase muncul sebagai karakter acak
 * yang tertulis ulang dari kiri ke kanan (kesan "decoding/enkripsi"),
 * hold, lalu berpindah ke frase berikutnya.
 *
 * - Timer + setState hanya di dalam callback (aman untuk aturan lint
 *   set-state-in-effect, tanpa library).
 * - prefers-reduced-motion → teks statis (frase pertama).
 * - Aksesibilitas: teks statis untuk pembaca layar; span animasi aria-hidden.
 */
export function ScrambleText({
  phrases,
  className,
  srText,
  resolveMs = 32,
  holdMs = 2600,
}: {
  phrases: string[];
  className?: string;
  srText?: string;
  resolveMs?: number;
  holdMs?: number;
}) {
  const phrasesKey = phrases.join("\u0000");
  const safe = React.useMemo(
    () => phrasesKey.split("\u0000").filter((p) => p.trim() !== "").slice(0, 6),
    [phrasesKey]
  );

  // Default false = sama dengan render server → hydrasi cocok. Preferensi
  // dipindai SETELAH mount (lewat timer) lalu dikirim ulang sebagai update.
  const [reduced, setReduced] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [display, setDisplay] = React.useState("");
  const [revealed, setRevealed] = React.useState(0);

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
    const full = safe[index % count] ?? "";
    // Kecepatan adaptif: frase panjang tetap selesai dalam ~1,6 detik.
    const step = Math.max(14, Math.min(resolveMs, Math.round(1600 / Math.max(full.length, 1))));
    let done = 0;
    let phase: "decrypt" | "hold" = "decrypt";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scrambleTail = (from: number): string =>
      full
        .slice(from)
        .split("")
        .map(() => POOL[Math.floor(Math.random() * POOL.length)])
        .join("");

    const tick = () => {
      if (phase === "decrypt") {
        done += 1;
        setRevealed(done);
        setDisplay(full.slice(0, done) + scrambleTail(done));
        if (done >= full.length) {
          phase = "hold";
          timer = setTimeout(tick, holdMs);
          return;
        }
        timer = setTimeout(tick, step);
      } else {
        // Frase berikutnya: mulai dari "terenskripsi penuh" → terungkap lagi.
        setIndex((i) => (i + 1) % count);
      }
    };

    timer = setTimeout(tick, step);
    return () => clearTimeout(timer);
  }, [safe, count, index, reduced, resolveMs, holdMs]);

  const staticText = safe[0] ?? "";
  if (count === 0) return null;

  if (reduced) {
    return <span className={className}>{staticText}</span>;
  }

  const shown = display.slice(0, revealed);
  const scrambled = display.slice(revealed);

  return (
    <span className={className}>
      {/* Teks statis untuk pembaca layar; animasi disembunyikan dari SR. */}
      <span className="sr-only">{srText ?? staticText}</span>
      <span aria-hidden="true" className="dc-scramble">
        {shown}
        <span className="dc-scramble__tail">{scrambled}</span>
        {display.length > 0 ? <span className="tw-caret">▌</span> : null}
      </span>
    </span>
  );
}
