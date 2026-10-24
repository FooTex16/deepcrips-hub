import { makeAdminList } from "@/lib/admin-crud";

/** GET /api/admin/reports — daftar laporan konten (moderator+). */
export const GET = makeAdminList({
  table: "content_reports",
  role: "staff",
  select:
    "*, reporter:profiles(id, display_name, avatar_url), " +
    "topic:forum_topics(id, title, hidden, locked), " +
    "comment:forum_comments(id, body, hidden)",
  filterColumns: ["status"],
  orderBy: { column: "created_at", ascending: false },
  limit: 25,
});
