import { makeAdminDelete } from "@/lib/admin-crud";

export const DELETE = makeAdminDelete({
  table: "featured_items",
  entity: "featured_item",
  role: "content_admin",
  allowDelete: true,
});
