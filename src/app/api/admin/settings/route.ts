import { makeAdminList } from "@/lib/admin-crud";

/** GET /api/admin/settings — daftar pengaturan situs (publik dibaca semua). */
export const GET = makeAdminList({
  table: "site_settings",
  role: "staff",
  searchColumns: ["key", "description"],
  orderBy: { column: "key", ascending: true },
  limit: 100,
});
