import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand mark DeepCrips Hub.
 *
 * Catatan: aset maskot resmi (karakter biru + hoodie hitam + identitas Python)
 * BELUM tersedia di repository. Komponen ini adalah penanda geometris sementara
 * yang dirancang mudah diganti — letakkan aset resmi di /public/mascot/ lalu
 * ganti bagian <svg> di bawah dengan <Image src="/mascot/....png" alt="DeepCrips" />.
 */
export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-cyan shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" role="presentation">
        <path
          d="M12 2.5c-4.7 0-8 3.4-8 7.9 0 2.6 1.1 4.6 2.6 6 .6.6.9 1 .9 1.7v2.4c0 .6.7 1 1.2.7l2-1.2c.4-.2.8-.3 1.3-.3s.9.1 1.3.3l2 1.2c.5.3 1.2-.1 1.2-.7v-2.4c0-.7.3-1.1.9-1.7 1.5-1.4 2.6-3.4 2.6-6 0-4.5-3.3-7.9-8-7.9Z"
          fill="hsl(var(--brand-fg))"
          fillOpacity="0.95"
        />
        <circle cx="9" cy="10.5" r="1.6" fill="hsl(var(--brand))" />
        <circle cx="15" cy="10.5" r="1.6" fill="hsl(var(--brand))" />
      </svg>
    </span>
  );
}

export function BrandLogo({
  href = "/",
  size = 32,
  className,
  onClick,
}: {
  href?: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label="DeepCrips Hub — beranda"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <BrandMark
        size={size}
        className="transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
      />
      <span className="flex flex-col leading-none">
        <span className="whitespace-nowrap text-[15px] font-bold tracking-tight text-text">
          DeepCrips <span className="text-gradient-brand">Hub</span>
        </span>
        <span className="mt-0.5 whitespace-nowrap text-2xs text-text-faint transition-colors duration-200 group-hover:text-text-muted">
          Gaming &amp; Tech Content
        </span>
      </span>
    </Link>
  );
}
