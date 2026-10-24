import { makeAdminUpdate, makeAdminDelete } from "@/lib/admin-crud";
import { videoUpdate, withAutoSlug } from "@/lib/admin-schemas";

export const PATCH = makeAdminUpdate({
  table: "videos",
  entity: "video",
  role: "content_admin",
  updateSchema: videoUpdate,
  onUpdate: (data) => withAutoSlug(data),
});

export const DELETE = makeAdminDelete({
  table: "videos",
  entity: "video",
  role: "primary_admin",
  allowDelete: true,
});
