import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MessageSquare, Flame, Lock } from "lucide-react";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, ConfigMissingState } from "@/components/ui/states";
import { getAuthUser } from "@/lib/auth";
import { isSupabaseReady } from "@/lib/data/home";
import { getTopic, listComments, getTopicReactions, getCommentReactionCounts, getUserReactions, type CommentWithReactions } from "@/lib/data/forum";
import { renderMarkdown } from "@/lib/markdown";
import { formatDate, timeAgo, truncate } from "@/lib/utils";
import { ReactionBar, LoginPrompt, ReportButton } from "@/components/forum/interactions";
import { CommentForm } from "@/components/forum/comment-form";
import { ModerationBar } from "@/components/forum/moderation-bar";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const topic = await getTopic(id);
  if (!topic || topic.hidden) return { title: "Topik tidak ditemukan" };
  return {
    title: truncate(topic.title, 80),
    description: truncate(topic.body, 160),
  };
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params;
  const ready = await isSupabaseReady();
  const [topic, user] = await Promise.all([getTopic(id), getAuthUser()]);

  if (!ready) {
    return (
      <Section>
        <ConfigMissingState feature="Halaman forum" />
      </Section>
    );
  }
  if (!topic || topic.hidden) notFound();

  const [comments, topicReactions, userReactions] = await Promise.all([
    listComments(topic.id),
    getTopicReactions(topic.id),
    getUserReactions(user?.id ?? null, topic.id),
  ]);

  const flatCommentIds: string[] = [];
  const collect = (cs: CommentWithReactions[]) => {
    for (const c of cs) {
      flatCommentIds.push(c.id);
      if (c.children) collect(c.children);
    }
  };
  collect(comments);
  const commentCounts = await getCommentReactionCounts(flatCommentIds);

  const topicHtml = renderMarkdown(topic.body);
  const nextPath = `/forum/${topic.id}`;

  return (
    <Section className="pt-8 sm:pt-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-text-faint">
        <Link href="/forum" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Forum
        </Link>
      </nav>

      <article className="mx-auto max-w-3xl">
        {/* Header topik */}
        <header className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {topic.locked && (
              <Badge tone="warning" icon={<Lock className="h-3 w-3" aria-hidden />}>
                Terkunci
              </Badge>
            )}
            {topic.game && (
              <Link href={`/games/${topic.game.slug}`}>
                <Badge tone="info">{topic.game.title}</Badge>
              </Link>
            )}
            <span className="text-xs text-text-faint">{formatDate(topic.created_at)}</span>
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl">{topic.title}</h1>
        </header>

        {/* Kartu penulis + isi */}
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Avatar src={topic.author?.avatar_url} name={topic.author?.display_name ?? "?"} size="sm" />
            <div>
              <p className="text-sm font-semibold text-text">{topic.author?.display_name ?? "Anggota"}</p>
              <p className="text-xs text-text-faint">{timeAgo(topic.created_at)}</p>
            </div>
            <div className="ml-auto">
              <ModerationBar targetType="topic" targetId={topic.id} hidden={topic.hidden} locked={topic.locked} />
            </div>
          </div>
          <div className="prose-dc" dangerouslySetInnerHTML={{ __html: topicHtml }} />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <ReactionBar
              targetType="topic"
              targetId={topic.id}
              counts={Object.fromEntries(topicReactions)}
              active={userReactions.topic}
            />
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                {topic.comment_count} komentar
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" aria-hidden />
                {Math.round(topic.hotness_score)}
              </span>
              <ReportButton targetType="topic" targetId={topic.id} />
            </div>
          </div>
        </div>

        {/* Komentar */}
        <section className="mt-10" aria-labelledby="komentar-heading">
          <h2 id="komentar-heading" className="mb-5 text-lg font-semibold text-text">
            Komentar ({flatCommentIds.length})
          </h2>

          {topic.locked && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-text-muted">
              <Lock className="h-4 w-4 text-warning" aria-hidden />
              Topik ini dikunci — komentar baru tidak diterima.
            </div>
          )}

          {/* Form komentar */}
          {!topic.locked && (
            <div className="mb-6">
              {user ? (
                <CommentForm topicId={topic.id} />
              ) : (
                <LoginPrompt next={nextPath} message="Masuk dengan Google untuk ikut berdiskusi." />
              )}
            </div>
          )}

          {/* Daftar komentar */}
          {comments.length > 0 ? (
            <ul className="space-y-5">
              {comments.map((comment) => (
                <CommentNode
                  key={comment.id}
                  comment={comment}
                  topicId={topic.id}
                  locked={topic.locked}
                  userReactions={userReactions.comments}
                  reactionCounts={commentCounts}
                  depth={0}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Belum ada komentar"
              description="Jadilah yang pertama memberi tanggapan."
            />
          )}
        </section>
      </article>
    </Section>
  );
}

function CommentNode({
  comment,
  topicId,
  locked,
  userReactions,
  reactionCounts,
  depth,
}: {
  comment: CommentWithReactions;
  topicId: string;
  locked: boolean;
  userReactions: Map<string, Set<string>>;
  reactionCounts: Map<string, Map<string, number>>;
  depth: number;
}) {
  const html = renderMarkdown(comment.body);
  const counts = reactionCounts.get(comment.id);

  return (
    <li className={depth > 0 ? "ml-6 border-l border-border pl-4 sm:ml-10" : ""}>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center gap-3">
          <Avatar src={comment.author?.avatar_url} name={comment.author?.display_name ?? "?"} size="xs" />
          <p className="text-sm font-semibold text-text">{comment.author?.display_name ?? "Anggota"}</p>
          <span className="text-xs text-text-faint">{timeAgo(comment.created_at)}</span>
          <div className="ml-auto flex items-center gap-2">
            <ReportButton targetType="comment" targetId={comment.id} />
            <ModerationBar targetType="comment" targetId={comment.id} hidden={comment.hidden} />
          </div>
        </div>
        <div className="prose-dc text-sm" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <ReactionBar
            targetType="comment"
            targetId={comment.id}
            counts={counts ? Object.fromEntries(counts) : {}}
            active={userReactions.get(comment.id) ?? new Set()}
          />
          {!locked && depth < 1 && (
            <Link
              href={`/forum/${topicId}#komentar-${comment.id}`}
              className="text-xs font-medium text-brand hover:underline"
            >
              Balas
            </Link>
          )}
        </div>
      </div>

      {comment.children && comment.children.length > 0 && (
        <ul className="mt-4 space-y-4">
          {comment.children.map((child) => (
            <CommentNode
              key={child.id}
              comment={child}
              topicId={topicId}
              locked={locked}
              userReactions={userReactions}
              reactionCounts={reactionCounts}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}

      {depth < 1 && !locked && (
        <div id={`komentar-${comment.id}`} className="mt-3">
          <details className="group">
            <summary className="cursor-pointer list-none text-xs font-medium text-text-muted hover:text-text">
              Balas komentar ini…
            </summary>
            <div className="mt-2">
              <CommentForm topicId={topicId} parentId={comment.id} />
            </div>
          </details>
        </div>
      )}
    </li>
  );
}
