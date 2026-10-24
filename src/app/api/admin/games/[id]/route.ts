import { makeAdminUpdate, makeAdminDelete } from "@/lib/admin-crud";
import { gameUpdate, withAutoSlug } from "@/lib/admin-schemas";

export const PATCH = makeAdminUpdate({
  table: "games",
  entity: "game",
  role: "content_admin",
  updateSchema: gameUpdate,
  onUpdate: (data) => withAutoSlug(data),
});

export const DELETE = makeAdminDelete({
  table: "games",
  entity: "game",
  role: "primary_admin",
  allowDelete: true,
});
