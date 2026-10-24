import { makeAdminUpdate, makeAdminDelete } from "@/lib/admin-crud";
import { fileUpdate, withAutoSlug } from "@/lib/admin-schemas";

export const PATCH = makeAdminUpdate({
  table: "files",
  entity: "file",
  role: "content_admin",
  updateSchema: fileUpdate,
  onUpdate: (data) => withAutoSlug(data),
});

export const DELETE = makeAdminDelete({
  table: "files",
  entity: "file",
  role: "primary_admin",
  allowDelete: true,
});
