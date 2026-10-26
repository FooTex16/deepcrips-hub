import Link from "next/link";
import { FileDown, Gamepad2 } from "lucide-react";
import type { FileItem } from "@/lib/types";
import { fileCategoryLabel } from "@/lib/types";
import { cn, formatBytes, formatDate, truncate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** Kartu file unduhan — metadata penting: nama, game, kategori, tanggal. */
export function FileCard({ file, className }: { file: FileItem; className?: string }) {
  return (
    <Link
      href={`/downloads/${file.slug}`}
      className={cn(
        "group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <FileDown className="h-5 w-5" aria-hidden />
        </span>
        <span className="flex items-center gap-1.5">
          {file.is_template && <Badge tone="neutral">Contoh</Badge>}
          <Badge tone="info">{fileCategoryLabel(file.category)}</Badge>
        </span>
      </div>
      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-text transition-colors group-hover:text-brand">
        {file.title}
      </h3>
      {file.summary && <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{truncate(file.summary, 110)}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-text-faint">
        {file.game && (
          <span className="inline-flex items-center gap-1">
            <Gamepad2 className="h-3.5 w-3.5" aria-hidden />
            {file.game.title}
          </span>
        )}
        {typeof file.size_bytes === "number" && <span>{formatBytes(file.size_bytes)}</span>}
        {file.published_at && <span>{formatDate(file.published_at)}</span>}
      </div>
    </Link>
  );
}
