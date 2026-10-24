"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Gambar URL admin dengan fallback anggun.
 *
 * next/image dihindari untuk cover/screenshot eksternal karena host bisa
 * berubah (dikelola admin) dan akan membuat runtime error bila tidak ada di
 * remotePatterns. <img> + lazy loading + fallback inisial lebih tangguh.
 */
export function SmartImg({
  src,
  alt = "",
  className,
  imgClassName,
  fallback,
  sizes,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
  sizes?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const show = src && !failed;
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      {show ? (
        // eslint-disable-next-line @next/next/no-img-element -- host eksternal dikelola admin
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        (fallback ?? <span className="flex h-full w-full items-center justify-center text-text-faint">🎮</span>)
      )}
    </span>
  );
}
