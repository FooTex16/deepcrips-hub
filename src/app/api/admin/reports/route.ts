import { makeAdminList } from "@/lib/admin-crud";

/** GET /api/admin/reports — daftar laporan konten (moderator+). */
export const GET = makeAdminList({
  table: "content_reports",
  role: "staff",
  select:
    // !reporter_id: content_reports punya dua FK ke profiles (reporter_id,
    // handled_by) → embed tanpa hint memicu PGRST201.
    "*, reporter:profiles!reporter_id(id, display_name, avatar_url), " +
    "topic:forum_topics!topic_id(id, title, hidden, locked), " +
    "comment:forum_comments!comment_id(id, body, hidden)",
  filterColumns: ["status"],
  orderBy: { column: "created_at", ascending: false },
  limit: 25,
});
