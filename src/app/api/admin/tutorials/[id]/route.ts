import { makeAdminUpdate, makeAdminDelete } from "@/lib/admin-crud";
import { tutorialUpdate, withAutoSlug } from "@/lib/admin-schemas";

export const PATCH = makeAdminUpdate({
  table: "tutorials",
  entity: "tutorial",
  role: "content_admin",
  updateSchema: tutorialUpdate,
  onUpdate: (data) => withAutoSlug(data),
});

export const DELETE = makeAdminDelete({
  table: "tutorials",
  entity: "tutorial",
  role: "primary_admin",
  allowDelete: true,
});
