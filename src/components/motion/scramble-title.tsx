"use client";

import * as React from "react";

/** Karacak acak bergaya "enkripsi" (hex + simbol). */
const POOL = "0123456789ABCDEF#$%&*<>/\\[]=";

export interface ScrambleSegment {
  /** Teks asli segmen ini. */
  text: string;
  /** Kelas styling segmen (mis. gradien merek). */
  className?: string;
  /** Sisipkan <br> (sembunyi di mobile) setelah segmen ini. */
  brAfter?: boolean;
}

/**
 * Judul multi-segmen dengan animasi "terdekripsi": seluruh judul muncul
 * sebagai karakter acak yang tertulis ulang dari kiri ke kanan hingga
 * menjadi teks asli, hold, lalu dienkripsi ulang (loop) — kesan decoding.
 *
 * - Masing-masing segmen tetap bisa distyling (gradien, dll) dan jeda
 *   baris <br> dipertahankan.
 * - Render awal = karacak DETERMINISTIK (cocok server & klien, tanpa
 *   kilatan kosong saat hidrasi).
 * - prefers-reduced-motion → teks statis langsung.
 * - Aksesibilitas/SEO: teks utuh di span sr-only; animasi aria-hidden.
 */
export function ScrambleTitle({
  segments,
  className,
  srText,
  resolveMs = 32,
  holdMs = 6000,
}: {
  segments: ScrambleSegment[];
  className?: string;
  srText?: string;
  resolveMs?: number;
  holdMs?: number;
}) {
  // JSON round-trip → identik di server & klien, dep stabil meski prop inline.
  const segsKey = JSON.stringify(segments);
  const segs = React.useMemo<ScrambleSegment[]>(
    () => JSON.parse(segsKey) as ScrambleSegment[],
    [segsKey]
  );
  const full = React.useMemo(() => segs.map((s) => s.text).join(""), [segs]);

  // Karacak deterministik untuk render awal (hidrasi cocok, judul tak kosong).
  const initialFrame = React.useMemo(
    () =>
      full
        .split("")
        .map((c, i) => (c === " " ? " " : POOL[i % POOL.length]))
        .join(""),
    [full]
  );

  const [reduced, setReduced] = React.useState(false);
  const [revealed, setRevealed] = React.useState(0);
  const [frame, setFrame] = React.useState(initialFrame);

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

  React.useEffect(() => {
    if (reduced || full.length === 0) return;
    // Kecepatan adaptif: judul panjang tetap selesai dalam ~1,6 detik.
    const step = Math.max(14, Math.min(resolveMs, Math.round(1600 / Math.max(full.length, 1))));
    const scrambleTail = (from: number): string =>
      full
        .slice(from)
        .split("")
        .map((c) => (c === " " ? " " : POOL[Math.floor(Math.random() * POOL.length)]))
        .join("");

    let done = 0;
    let phase: "decrypt" | "hold" = "decrypt";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (phase === "decrypt") {
        done += 1;
        setRevealed(done);
        setFrame(full.slice(0, done) + scrambleTail(done));
        if (done >= full.length) {
          phase = "hold";
          timer = setTimeout(tick, holdMs);
          return;
        }
        timer = setTimeout(tick, step);
      } else {
        // Enkripsi ulang sebentar → dekripsi lagi dari awal (loop).
        done = 0;
        phase = "decrypt";
        setRevealed(0);
        setFrame(scrambleTail(0));
        timer = setTimeout(tick, step);
      }
    };

    timer = setTimeout(tick, step);
    return () => clearTimeout(timer);
  }, [full, reduced, resolveMs, holdMs]);

  if (!full) return null;

  const renderStatic = () => (
    <>
      {segs.map((s, i) => (
        <React.Fragment key={i}>
          <span className={s.className}>{s.text}</span>
          {s.brAfter && <br className="hidden sm:block" />}
        </React.Fragment>
      ))}
    </>
  );

  if (reduced) {
    return <span className={className}>{renderStatic()}</span>;
  }

  // Offset awal tiap teks asli (murni, tanpa mutasi variabel render).
  const starts = segs.map((_, i) =>
    segs.slice(0, i).reduce((n, s) => n + s.text.length, 0)
  );
  const animated = segs.map((s, i) => {
    const start = starts[i] ?? 0;
    const segFrame = frame.slice(start, start + s.text.length);
    const cut = Math.min(Math.max(revealed - start, 0), s.text.length);
    return (
      <React.Fragment key={i}>
        <span className={s.className}>{segFrame.slice(0, cut)}</span>
        <span className="dc-scramble__tail">{segFrame.slice(cut)}</span>
        {s.brAfter && <br className="hidden sm:block" />}
      </React.Fragment>
    );
  });

  return (
    <span className={className}>
      {/* Teks utuh untuk SEO/pembaca layar; animasi disembunyikan dari SR. */}
      <span className="sr-only">{srText ?? full}</span>
      <span aria-hidden="true">{animated}</span>
    </span>
  );
}
