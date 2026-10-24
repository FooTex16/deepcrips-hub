import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  xs: "h-6 w-6 text-2xs",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

/** Avatar inisial + gambar profil (nama/foto Google, tanpa email). */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2 font-semibold text-text-muted",
        sizeStyles[size],
        className
      )}
      aria-hidden
    >
      {src && !errored ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar eksternal kecil, menghindari layout shift dengan wrap berukuran tetap
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setErrored(true)} />
      ) : (
        initial
      )}
    </span>
  );
}
