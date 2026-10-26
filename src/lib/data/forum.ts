import { createClient } from "@/lib/supabase/server";
import type { ForumComment, ForumTopic, Profile } from "@/lib/types";
import { templatesEnabled } from "@/lib/data/settings";
import { TEMPLATE_TOPICS, fillTemplates, findTemplateById, isTemplateId } from "@/lib/templates";

export const TOPIC_PAGE_SIZE = 10;

export interface ForumListParams {
  q?: string;
  sort?: "latest" | "popular";
  page?: number;
}

export interface Paged<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}

// !author_id: forum_topics ↔ profiles punya jalur m2m via forum_reactions →
// tanpa hint embed author memicu PGRST201 dan daftar topik jadi kosong.
// Satu literal string (bukan concatenation `+`) agar parser tipe supabase-js
// tetap mengenali select ini.
const TOPIC_SELECT =
  "*, author:profiles!author_id(id, display_name, avatar_url), game:games!game_id(id, slug, title)";

/** Daftar topik forum: cari (judul+isi), sortir, paginasi — semua server-side. */
export async function listTopics(params: ForumListParams): Promise<Paged<ForumTopic>> {
  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort === "popular" ? "popular" : "latest";
  try {
    const supabase = await createClient();
    let query = supabase.from("forum_topics").select(TOPIC_SELECT, { count: "exact" }).eq("hidden", false);

    if (params.q) {
      // Pencarian kombinasi FTS (fallback ilike bila kolom tsv belum ada).
      query = query.textSearch("search_tsv", params.q, { config: "simple", type: "websearch" });
    }

    if (sort === "popular") {
      query = query.order("hotness_score", { ascending: false }).order("last_activity_at", { ascending: false });
    } else {
      query = query.order("last_activity_at", { ascending: false });
    }

    const from = (page - 1) * TOPIC_PAGE_SIZE;
    const { data, count, error } = await query.range(from, from + TOPIC_PAGE_SIZE - 1);

    if (error && params.q) {
      // Fallback ilike bila FTS gagal (mis. kolom belum ada).
      const fallback = await supabase
        .from("forum_topics")
        .select(TOPIC_SELECT, { count: "exact" })
        .eq("hidden", false)
        .or(`title.ilike.%${params.q.replace(/[%_,()\\]/g, "")}%,body.ilike.%${params.q.replace(/[%_,()\\]/g, "")}%`)
        .order("last_activity_at", { ascending: false })
        .range(from, from + TOPIC_PAGE_SIZE - 1);
      const total = fallback.count ?? 0;
      return {
        items: (fallback.data ?? []) as ForumTopic[],
        count: total,
        page,
        totalPages: Math.ceil(total / TOPIC_PAGE_SIZE),
      };
    }

    const total = count ?? 0;
    let items = (data ?? []) as ForumTopic[];
    if (page === 1 && !params.q) {
      items = await fillTemplates(items, TEMPLATE_TOPICS);
    }
    return { items, count: total, page, totalPages: Math.ceil(total / TOPIC_PAGE_SIZE) };
  } catch {
    return { items: [], count: 0, page, totalPages: 0 };
  }
}

export async function getTopic(id: string): Promise<ForumTopic | null> {
  if (isTemplateId(id)) {
    if (!(await templatesEnabled())) return null;
    return findTemplateById(TEMPLATE_TOPICS, id);
  }
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("forum_topics").select(TOPIC_SELECT).eq("id", id).maybeSingle();
    return (data as ForumTopic | null) ?? null;
  } catch {
    return null;
  }
}

export interface CommentWithReactions extends ForumComment {
  children?: CommentWithReactions[];
}

/** Komentar topik (tak tersembunyi), dikelompokkan induk→balasan. */
export async function listComments(topicId: string): Promise<CommentWithReactions[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("forum_comments")
      .select("*, author:profiles!author_id(id, display_name, avatar_url)")
      .eq("topic_id", topicId)
      .eq("hidden", false)
      .order("created_at", { ascending: true });

    const flat = (data ?? []) as CommentWithReactions[];
    const byId = new Map(flat.map((c) => [c.id, { ...c, children: [] as CommentWithReactions[] }]));
    const roots: CommentWithReactions[] = [];
    for (const comment of byId.values()) {
      if (comment.parent_id && byId.has(comment.parent_id)) {
        byId.get(comment.parent_id)!.children!.push(comment);
      } else {
        roots.push(comment);
      }
    }
    return roots;
  } catch {
    return [];
  }
}

/** Reaksi milik user tertentu pada topik & komentar topik itu (state aktif). */
export async function getUserReactions(
  userId: string | null,
  topicId: string,
  commentIds: string[] = []
): Promise<{ topic: Set<string>; comments: Map<string, Set<string>> }> {
  const topic = new Set<string>();
  const comments = new Map<string, Set<string>>();
  if (!userId) return { topic, comments };
  try {
    const supabase = await createClient();
    const [topicRes, commentRes] = await Promise.all([
      supabase.from("forum_reactions").select("emoji").eq("user_id", userId).eq("topic_id", topicId),
      commentIds.length > 0
        ? supabase
            .from("forum_reactions")
            .select("emoji, comment_id")
            .eq("user_id", userId)
            .in("comment_id", commentIds)
        : Promise.resolve({ data: [] as Array<{ emoji: string; comment_id: string }> }),
    ]);
    for (const row of (topicRes.data ?? []) as Array<{ emoji: string }>) {
      topic.add(row.emoji);
    }
    for (const row of (commentRes.data ?? []) as Array<{ emoji: string; comment_id: string }>) {
      if (!comments.has(row.comment_id)) comments.set(row.comment_id, new Set());
      comments.get(row.comment_id)!.add(row.emoji);
    }
  } catch {
    /* diamkan — state reaksi hanya pelengkap */
  }
  return { topic, comments };
}

/** Reaksi per komentar (jumlah) untuk ditampilkan. */
export async function getCommentReactionCounts(
  commentIds: string[]
): Promise<Map<string, Map<string, number>>> {
  const result = new Map<string, Map<string, number>>();
  if (commentIds.length === 0) return result;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("forum_reactions")
      .select("emoji, comment_id")
      .in("comment_id", commentIds);
    for (const row of (data ?? []) as Array<{ emoji: string; comment_id: string }>) {
      if (!result.has(row.comment_id)) result.set(row.comment_id, new Map());
      const m = result.get(row.comment_id)!;
      m.set(row.emoji, (m.get(row.emoji) ?? 0) + 1);
    }
  } catch {
    /* diamkan */
  }
  return result;
}

export async function getTopicReactions(topicId: string): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("forum_reactions").select("emoji").eq("topic_id", topicId);
    for (const row of (data ?? []) as Array<{ emoji: string }>) {
      m.set(row.emoji, (m.get(row.emoji) ?? 0) + 1);
    }
  } catch {
    /* diamkan */
  }
  return m;
}

export interface TopicWithAuthor extends ForumTopic {
  author?: Profile | null;
}
