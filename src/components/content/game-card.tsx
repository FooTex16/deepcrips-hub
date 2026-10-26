import Link from "next/link";
import { cn, truncate } from "@/lib/utils";
import type { Game } from "@/lib/types";
import { SmartImg } from "@/components/ui/smart-img";

/** Kartu game dengan artwork + fallback inisial bila URL tidak valid. */
export function GameCard({ game, className }: { game: Game; className?: string }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn(
        "group relative flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <SmartImg
        src={game.cover_url}
        alt={`Cover ${game.title}`}
        className="absolute inset-0"
        imgClassName="transition-transform duration-300 group-hover:scale-[1.04]"
        fallback={
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft via-surface-2 to-surface text-4xl font-bold text-brand/40"
          >
            {game.title.charAt(0).toUpperCase()}
          </span>
        }
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      {game.is_template && (
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          Contoh
        </span>
      )}
      <span className="relative p-4">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-white">{game.title}</h3>
        {(game.genre || game.summary) && (
          <span className="mt-0.5 block line-clamp-1 text-xs text-white/75">
            {game.genre ? `${game.genre} · ` : ""}
            {truncate(game.summary, 60)}
          </span>
        )}
      </span>
    </Link>
  );
}
