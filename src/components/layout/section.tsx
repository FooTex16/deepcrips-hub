import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Header section halaman — hierarki konsisten di seluruh situs. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-brand">{eyebrow}</p>
        )}
        <h2 className="text-xl font-bold tracking-tight text-text sm:text-2xl">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-brand transition-colors hover:text-cyan"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Container section dengan padding vertikal konsisten. */
export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("container py-10 sm:py-14", className)}>
      {children}
    </section>
  );
}
