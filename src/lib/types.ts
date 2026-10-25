/**
 * Tipe domain DeepCrips Hub.
 * Sumber kebenaran skema ada di supabase/migrations/*.sql — tipe ini
 * dipertahankan sinkron secara manual (lihat docs/DATABASE.md).
 */

export type ContentStatus = "draft" | "in_review" | "published" | "archived";
export type MemberRole = "primary_admin" | "content_admin" | "moderator";
export type RequestStatus = "pending" | "in_review" | "planned" | "completed" | "rejected";
export type CheckStatus = "unverified" | "manual_review" | "hash_matched" | "reported_issue";
export type VersionStatus = "available" | "deprecated" | "unavailable";
export type HostStatus = "active" | "inactive" | "reported_broken";
export type ReportStatus = "open" | "resolved" | "dismissed";

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  genre: string | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileItem {
  id: string;
  slug: string;
  game_id: string | null;
  title: string;
  summary: string | null;
  description: string | null;
  category: string;
  size_bytes: number | null;
  source_info: string | null;
  security_notes: string | null;
  check_status: CheckStatus;
  check_notes: string | null;
  screenshots: string[];
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  game?: Game | null;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version_label: string;
  release_notes: string | null;
  released_at: string | null;
  sha256: string | null;
  compatibility: string | null;
  status: VersionStatus;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface DownloadHost {
  id: string;
  file_version_id: string;
  name: string;
  url: string;
  is_active: boolean;
  status: HostStatus;
  priority: number;
  status_note: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Metadata host untuk publik (tanpa URL — URL hanya lewat /api/download). */
export interface DownloadHostPublic {
  id: string;
  file_version_id: string;
  name: string;
  is_active: boolean;
  status: HostStatus;
  priority: number;
  status_note: string | null;
  last_checked_at: string | null;
}

export interface Tutorial {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string;
  category: string;
  game_id: string | null;
  cover_url: string | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  game?: Game | null;
}

export interface Video {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  game_id: string | null;
  duration_seconds: number | null;
  status: ContentStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeaturedItem {
  id: string;
  section: string;
  game_id: string | null;
  file_id: string | null;
  tutorial_id: string | null;
  video_id: string | null;
  position: number;
  created_at: string;
}

export interface ForumTopic {
  id: string;
  slug: string;
  title: string;
  body: string;
  author_id: string;
  game_id: string | null;
  hidden: boolean;
  locked: boolean;
  reaction_count: number;
  comment_count: number;
  hotness_score: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
  game?: Game | null;
}

export interface ForumComment {
  id: string;
  topic_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  hidden: boolean;
  reaction_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile | null;
}

export interface ForumReaction {
  id: string;
  user_id: string;
  topic_id: string | null;
  comment_id: string | null;
  emoji: string;
  created_at: string;
}

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "👀"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface ContentReport {
  id: string;
  reporter_id: string;
  topic_id: string | null;
  comment_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface RequestAttachment {
  /** Nama file asli (tanpa path). */
  name: string;
  /** URL publik di Storage (bucket request-files). */
  url: string;
  /** Ukuran dalam byte. */
  size: number;
  /** MIME type saat upload. */
  type: string;
}

export interface ContentRequest {
  id: string;
  title: string;
  request_type: "file" | "tutorial" | "video" | "game" | "other";
  game_id: string | null;
  description: string;
  /** Script/kode atau teks tambahan yang ditempel pengusul (opsional). */
  script_text: string | null;
  /** URL publik screenshot preview (maks 6). */
  screenshots: string[];
  /** File lampiran selain gambar (maks 5). */
  attachments: RequestAttachment[];
  requester_id: string;
  status: RequestStatus;
  vote_count: number;
  admin_notes: string | null;
  result_file_id: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile | null;
  game?: Game | null;
  result_file?: { id: string; slug: string; title: string } | null;
  has_voted?: boolean;
}

export interface AuditLog {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

/** Hasil pencarian global (fungsi SQL global_search). */
export interface GlobalSearchResult {
  source: "game" | "file" | "tutorial" | "video";
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  url: string;
  rank: number;
}

/** Label & warna status publikasi — konsisten di seluruh UI. */
export const CONTENT_STATUS_META: Record<ContentStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", tone: "neutral" },
  in_review: { label: "Menunggu Pemeriksaan", tone: "warning" },
  published: { label: "Published", tone: "success" },
  archived: { label: "Diarsipkan", tone: "neutral" },
};

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  pending: { label: "Menunggu Peninjauan", tone: "warning" },
  in_review: { label: "Ditinjau", tone: "info" },
  planned: { label: "Direncanakan", tone: "info" },
  completed: { label: "Selesai", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
};

export const VERSION_STATUS_META: Record<VersionStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  available: { label: "Tersedia", tone: "success" },
  deprecated: { label: "Usang — tidak direkomendasikan", tone: "warning" },
  unavailable: { label: "Tidak tersedia", tone: "danger" },
};

export const HOST_STATUS_META: Record<HostStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  active: { label: "Aktif", tone: "success" },
  inactive: { label: "Nonaktif", tone: "neutral" },
  reported_broken: { label: "Dilaporkan bermasalah", tone: "danger" },
};

export const CHECK_STATUS_META: Record<CheckStatus, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  unverified: { label: "Belum diverifikasi", tone: "warning" },
  manual_review: { label: "Ditinjau manual", tone: "info" },
  hash_matched: { label: "SHA-256 cocok", tone: "success" },
  reported_issue: { label: "Dilaporkan bermasalah", tone: "danger" },
};

export const FILE_CATEGORIES = [
  { value: "tools", label: "Tools & Utilitas Windows" },
  { value: "script", label: "Script" },
  { value: "mod", label: "Modifikasi / Add-on" },
  { value: "cheat_engine", label: "Cheat Engine Files" },
  { value: "apk", label: "APK & Paket Game" },
  { value: "other", label: "Lainnya" },
] as const;

export function fileCategoryLabel(value: string): string {
  return FILE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** Jenis file yang butuh peringatan risiko khusus. */
export const HIGH_RISK_CATEGORIES = new Set(["apk", "cheat_engine", "tools", "script", "mod"]);
