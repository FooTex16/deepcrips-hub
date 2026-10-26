import Link from "next/link";
import { MessageSquare, Flame } from "lucide-react";
import type { ForumTopic } from "@/lib/types";
import { cn, timeAgo, truncate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/** Baris topik forum (dipakai Home & halaman forum). */
export function TopicRow({ topic, className }: { topic: ForumTopic; className?: string }) {
  return (
    <Link
      href={`/forum/${topic.id}`}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 shadow-card transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <Avatar src={topic.author?.avatar_url} name={topic.author?.display_name ?? "?"} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-text transition-colors group-hover:text-brand">
            {topic.title}
          </h3>
          {topic.locked && <Badge tone="warning">Terkunci</Badge>}
          {topic.hidden && <Badge tone="danger">Disembunyikan</Badge>}
          {topic.is_template && <Badge tone="neutral">Contoh</Badge>}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-text-muted">{truncate(topic.body, 120)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-faint">
          <span>{topic.author?.display_name ?? "Anggota"}</span>
          <span>{timeAgo(topic.last_activity_at)}</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden />
            {topic.comment_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            {Math.round(topic.hotness_score)}
          </span>
        </div>
      </div>
    </Link>
  );
}
