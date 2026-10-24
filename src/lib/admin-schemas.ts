import { z } from "zod";
import { slugify } from "@/lib/utils";
import { validateImageUrl, validateHostUrl } from "@/lib/validate-url";

export const CONTENT_STATUSES = ["draft", "in_review", "published", "archived"] as const;
export const CHECK_STATUSES = ["unverified", "manual_review", "hash_matched", "reported_issue"] as const;
export const VERSION_STATUSES = ["available", "deprecated", "unavailable"] as const;
export const HOST_STATUSES = ["active", "inactive", "reported_broken"] as const;
export const REQUEST_STATUSES = ["pending", "in_review", "planned", "completed", "rejected"] as const;
export const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung.");

export const text = (max: number) =>
  z
    .string()
    .max(max, `Maksimal ${max} karakter.`)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim());

export const requiredText = (min: number, max: number) =>
  text(max).refine((s) => s.length >= min, `Minimal ${min} karakter.`);

export const optionalText = (max: number) => text(max).optional();

export const uuidOrNull = z.string().uuid().nullish();

export const httpUrlField = (label = "URL") =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => {
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, `${label} harus http(s).`)
    .optional();

export const imageUrlField = (label = "URL gambar") =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => validateImageUrl(v).ok, `${label} tidak valid.`)
    .optional();

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------
export const gameCreate = z.object({
  slug: slugSchema.optional(),
  title: requiredText(1, 120),
  summary: optionalText(400),
  description: optionalText(20000),
  cover_url: imageUrlField("Cover"),
  genre: optionalText(60),
  status: z.enum(CONTENT_STATUSES).default("draft"),
});
export const gameUpdate = gameCreate.partial();

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------
export const fileCreate = z.object({
  slug: slugSchema.optional(),
  game_id: uuidOrNull,
  title: requiredText(1, 160),
  summary: optionalText(400),
  description: optionalText(20000),
  category: requiredText(1, 40).default("other"),
  size_bytes: z.coerce.number().int().min(0).nullish(),
  source_info: optionalText(1000),
  security_notes: optionalText(4000),
  check_status: z.enum(CHECK_STATUSES).default("unverified"),
  check_notes: optionalText(2000),
  screenshots: z.array(httpUrlField("Screenshot").unwrap()).max(20).default([]),
  status: z.enum(CONTENT_STATUSES).default("draft"),
});
export const fileUpdate = fileCreate.partial();

// ---------------------------------------------------------------------------
// File versions
// ---------------------------------------------------------------------------
export const versionCreate = z.object({
  file_id: z.string().uuid("file_id wajib UUID."),
  version_label: requiredText(1, 40),
  release_notes: optionalText(8000),
  released_at: z.string().datetime().nullish(),
  sha256: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/, "SHA-256 harus 64 karakter hex.")
    .nullish(),
  compatibility: optionalText(500),
  status: z.enum(VERSION_STATUSES).default("available"),
  is_latest: z.boolean().default(false),
});
export const versionUpdate = versionCreate.partial().omit({ file_id: true });

// ---------------------------------------------------------------------------
// Download hosts
// ---------------------------------------------------------------------------
const hostUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => validateHostUrl(v).ok, "URL host tidak valid atau menunjuk ke host privat.");

export const hostCreate = z.object({
  file_version_id: z.string().uuid("file_version_id wajib UUID."),
  name: requiredText(1, 60),
  url: hostUrl,
  is_active: z.boolean().default(true),
  status: z.enum(HOST_STATUSES).default("active"),
  priority: z.coerce.number().int().min(0).max(1000).default(100),
  status_note: optionalText(500),
});
export const hostUpdate = hostCreate.partial().omit({ file_version_id: true });

// ---------------------------------------------------------------------------
// Tutorials
// ---------------------------------------------------------------------------
export const tutorialCreate = z.object({
  slug: slugSchema.optional(),
  title: requiredText(1, 160),
  summary: optionalText(400),
  body: z.string().max(100000).default(""),
  category: requiredText(1, 40).default("general"),
  game_id: uuidOrNull,
  cover_url: imageUrlField("Cover"),
  status: z.enum(CONTENT_STATUSES).default("draft"),
});
export const tutorialUpdate = tutorialCreate.partial();

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------
export const videoCreate = z.object({
  slug: slugSchema.optional(),
  title: requiredText(1, 180),
  description: optionalText(4000),
  video_url: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => {
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:") return false;
        const host = u.hostname.replace(/^www\./, "");
        return (
          (host === "youtube.com" &&
            (u.pathname.startsWith("/watch") || u.pathname.startsWith("/shorts/") || u.pathname.startsWith("/embed/"))) ||
          host === "youtu.be"
        );
      } catch {
        return false;
      }
    }, "URL harus tautan YouTube yang valid."),
  thumbnail_url: imageUrlField("Thumbnail"),
  category: requiredText(1, 40).default("general"),
  game_id: uuidOrNull,
  duration_seconds: z.coerce.number().int().min(0).nullish(),
  status: z.enum(CONTENT_STATUSES).default("draft"),
});
export const videoUpdate = videoCreate.partial();

// ---------------------------------------------------------------------------
// Featured items
// ---------------------------------------------------------------------------
export const featuredCreate = z
  .object({
    section: requiredText(1, 40),
    game_id: uuidOrNull,
    file_id: uuidOrNull,
    tutorial_id: uuidOrNull,
    video_id: uuidOrNull,
    position: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (v) =>
      [v.game_id, v.file_id, v.tutorial_id, v.video_id].filter(Boolean).length === 1,
    "Tepat satu target (game/file/tutorial/video) harus dipilih."
  );

// ---------------------------------------------------------------------------
// Content requests (admin)
// ---------------------------------------------------------------------------
export const requestStatusUpdate = z.object({
  status: z.enum(REQUEST_STATUSES),
  admin_notes: optionalText(4000),
  result_file_id: uuidOrNull,
});

// ---------------------------------------------------------------------------
// Forum reports (admin)
// ---------------------------------------------------------------------------
export const reportStatusUpdate = z.object({
  status: z.enum(REPORT_STATUSES),
  hide_target: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Members & roles
// ---------------------------------------------------------------------------
export const memberRoleUpdate = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["primary_admin", "content_admin", "staff"]),
  action: z.enum(["grant", "revoke"]),
});

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------
export const settingUpdate = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Wajib diisi.")
    .max(60, "Maksimal 60 karakter.")
    .regex(/^[a-z0-9_.]+$/, "Key hanya huruf kecil, angka, _, ."),
  value: z.record(z.string(), z.unknown()),
  description: optionalText(200),
});

// ---------------------------------------------------------------------------
// Helper: slug otomatis dari title bila slug kosong.
// ---------------------------------------------------------------------------
export function withAutoSlug<T extends { slug?: string; title?: string }>(row: T): T {
  if ((!row.slug || row.slug === "") && row.title) {
    return { ...row, slug: slugify(row.title) };
  }
  return row;
}

/** Validasi URL host, throw bila ditolak (dipakai onCreate/onUpdate). */
export function assertHostUrl(url: unknown): string {
  const v = validateHostUrl(String(url ?? ""));
  if (!v.ok) throw new Error(v.error);
  return v.normalized;
}
