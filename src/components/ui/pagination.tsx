import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  /** Query string awal yang harus dipertahankan, mis. "?q=x&game=y". */
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

function buildHref(basePath: string, searchParams: Record<string, string | undefined> | undefined, page: number): string {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
  }
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Pagination berbasis URL — tanpa state client, ramah keyboard & SEO. */
export function Pagination({ page, totalPages, basePath, searchParams, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const windowSize = 2;
  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) pages.push(p);
  }

  const items: Array<number | "gap"> = [];
  let prev = 0;
  for (const p of pages) {
    if (prev && p - prev > 1) items.push("gap");
    items.push(p);
    prev = p;
  }

  return (
    <nav aria-label="Paginasi" className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}>
      {page > 1 ? (
        <Link
          href={buildHref(basePath, searchParams, page - 1)}
          className={buttonVariants("ghost", "sm")}
          rel="prev"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Sebelumnya
        </Link>
      ) : (
        <span className={cn(buttonVariants("ghost", "sm"), "pointer-events-none opacity-40")} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </span>
      )}

      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-text-faint" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(basePath, searchParams, item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              buttonVariants(item === page ? "primary" : "ghost", "sm"),
              "min-w-9 px-2.5 tabular-nums"
            )}
          >
            {item}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={buildHref(basePath, searchParams, page + 1)} className={buttonVariants("ghost", "sm")} rel="next">
          Berikutnya
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(buttonVariants("ghost", "sm"), "pointer-events-none opacity-40")} aria-hidden>
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
