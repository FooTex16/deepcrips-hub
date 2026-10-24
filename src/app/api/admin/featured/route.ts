import { makeAdminList, makeAdminCreate } from "@/lib/admin-crud";
import { featuredCreate } from "@/lib/admin-schemas";

export const GET = makeAdminList({
  table: "featured_items",
  role: "content_admin",
  select:
    "*, game:games(id, slug, title), file:files(id, slug, title), tutorial:tutorials(id, slug, title), video:videos(id, slug, title)",
  orderBy: { column: "position", ascending: true },
  limit: 100,
});

export const POST = makeAdminCreate({
  table: "featured_items",
  entity: "featured_item",
  role: "content_admin",
  createSchema: featuredCreate,
});
