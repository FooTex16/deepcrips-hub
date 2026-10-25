import { makeAdminList } from "@/lib/admin-crud";

/** GET /api/admin/requests — daftar semua permintaan (termasuk pending). */
export const GET = makeAdminList({
  table: "content_requests",
  role: "staff",
  // Hint !kolom wajib: tanpa itu PostgREST ragu (banyak jalur ke tabel yang
  // sama lewat request_votes / files) dan membalas PGRST201.
  select:
    "*, requester:profiles!requester_id(id, display_name, avatar_url), " +
    "game:games!game_id(id, slug, title)",
  searchColumns: ["title", "description"],
  filterColumns: ["status", "request_type"],
  orderBy: { column: "created_at", ascending: false },
  limit: 25,
});
