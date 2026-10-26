import { makeAdminList, makeAdminCreate } from "@/lib/admin-crud";
import { gameCreate, withAutoSlug } from "@/lib/admin-schemas";

export const GET = makeAdminList({
  table: "games",
  role: "content_admin",
  searchColumns: ["title", "slug", "genre"],
  filterColumns: ["status"],
  orderBy: { column: "updated_at", ascending: false },
});

export const POST = makeAdminCreate({
  table: "games",
  entity: "game",
  role: "content_admin",
  createSchema: gameCreate,
  onCreate: (data, ctx) => ({ ...withAutoSlug(data), created_by: ctx.userId }),
});
