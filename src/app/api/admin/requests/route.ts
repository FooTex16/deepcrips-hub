import { makeAdminList } from "@/lib/admin-crud";

/** GET /api/admin/requests — daftar semua permintaan (termasuk pending). */
export const GET = makeAdminList({
  table: "content_requests",
  role: "staff",
  select: "*, requester:profiles(id, display_name, avatar_url), game:games(id, slug, title)",
  searchColumns: ["title", "description"],
  filterColumns: ["status", "request_type"],
  orderBy: { column: "created_at", ascending: false },
  limit: 25,
});
