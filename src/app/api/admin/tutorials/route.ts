import { makeAdminList, makeAdminCreate } from "@/lib/admin-crud";
import { tutorialCreate, withAutoSlug } from "@/lib/admin-schemas";

export const GET = makeAdminList({
  table: "tutorials",
  role: "content_admin",
  select: "*, game:games(id, slug, title)",
  searchColumns: ["title", "slug", "category"],
  filterColumns: ["status", "category"],
  orderBy: { column: "updated_at", ascending: false },
  limit: 25,
});

export const POST = makeAdminCreate({
  table: "tutorials",
  entity: "tutorial",
  role: "content_admin",
  createSchema: tutorialCreate,
  onCreate: (data, ctx) => ({ ...withAutoSlug(data), created_by: ctx.userId }),
});
