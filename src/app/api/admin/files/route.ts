import { makeAdminList, makeAdminCreate } from "@/lib/admin-crud";
import { fileCreate, withAutoSlug } from "@/lib/admin-schemas";

export const GET = makeAdminList({
  table: "files",
  role: "content_admin",
  select:
    "*, game:games(id, slug, title), versions:file_versions(id, version_label, is_latest, status)",
  searchColumns: ["title", "slug", "category"],
  filterColumns: ["status", "category", "check_status"],
  orderBy: { column: "updated_at", ascending: false },
  limit: 25,
});

export const POST = makeAdminCreate({
  table: "files",
  entity: "file",
  role: "content_admin",
  createSchema: fileCreate,
  onCreate: (data) => withAutoSlug(data),
});
