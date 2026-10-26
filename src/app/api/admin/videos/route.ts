import { makeAdminList, makeAdminCreate } from "@/lib/admin-crud";
import { videoCreate, withAutoSlug } from "@/lib/admin-schemas";

export const GET = makeAdminList({
  table: "videos",
  role: "content_admin",
  select: "*, game:games(id, slug, title)",
  searchColumns: ["title", "slug", "category"],
  filterColumns: ["status", "category"],
  orderBy: { column: "updated_at", ascending: false },
  limit: 25,
});

export const POST = makeAdminCreate({
  table: "videos",
  entity: "video",
  role: "content_admin",
  createSchema: videoCreate,
  // created_by wajib = auth.uid() (RLS videos_insert).
  onCreate: (data, ctx) => ({ ...withAutoSlug(data), created_by: ctx.userId }),
});
