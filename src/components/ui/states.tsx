import * as React from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

/** Skeleton loading — mencegah layout shift. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("skeleton", className)} {...props} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <Skeleton className="mb-4 h-40 w-full rounded-xl" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="mb-4 h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}

export function EmptyState({ title, description, icon, actionHref, actionLabel, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center">
      <span className="text-text-faint" aria-hidden>
        {icon ?? <Inbox className="h-8 w-8" />}
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="max-w-md text-sm text-text-muted">{description}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className={buttonVariants("primary", "sm")}>
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Terjadi kesalahan",
  description = "Data gagal dimuat. Silakan coba lagi.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-6 py-14 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-danger" aria-hidden />
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="max-w-md text-sm text-text-muted">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      ) : (
        <Link href="/" className={buttonVariants("outline", "sm")}>
          Kembali ke beranda
        </Link>
      )}
    </div>
  );
}

/** Banner konfigurasi environment yang belum lengkap (mis. Supabase kosong). */
export function ConfigMissingState({ feature }: { feature: string }) {
  return (
    <div
      role="status"
      className="rounded-2xl border border-warning/30 bg-warning/5 p-6 text-sm text-text-muted"
    >
      <p className="font-semibold text-text">{feature} belum tersedia.</p>
      <p className="mt-1">
        Environment Supabase belum dikonfigurasi pada deployment ini. Pemilik project perlu mengatur{" "}
        <code className="rounded border border-border bg-bg-subtle px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        dan{" "}
        <code className="rounded border border-border bg-bg-subtle px-1 py-0.5 text-xs">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        (lihat <code className="rounded border border-border bg-bg-subtle px-1 py-0.5 text-xs">.env.example</code>).
      </p>
    </div>
  );
}
