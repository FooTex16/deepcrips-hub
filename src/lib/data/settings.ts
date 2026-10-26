import { isHttpUrl } from "@/lib/utils";
import { createPublicClient } from "@/lib/supabase/server";

/**
 * Pembaca pengaturan tampilan situs (site_settings) untuk komponen server.
 *
 * Klien publik tanpa cookies() agar tidak memaksa semua halaman jadi
 * dynamic. Hasil di-cache di memori 60 detik — halaman dinamis yang
 * membaca toggle/template tidak menambah query berlebih.
 */

export const SITE_SETTING_KEYS = [
  "site_icon",
  "dashboard_typewriter",
  "social_links",
  "show_templates",
  "youtube_channel",
] as const;

const TTL_MS = 60_000;
let cache: { at: number; map: Record<string, unknown> } | null = null;

export type SettingsMap = Record<string, unknown>;

async function loadSettings(): Promise<SettingsMap> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", [...SITE_SETTING_KEYS]);
    if (error) throw error;
    const map: SettingsMap = {};
    for (const row of data ?? []) map[row.key] = row.value;
    cache = { at: Date.now(), map };
    return map;
  } catch {
    // Gagal jaringan → pakai cache lama bila ada, atau kosong.
    return cache?.map ?? {};
  }
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** URL ikon tab situs (favicon kustom) — null bila belum diatur. */
export async function getSiteIconUrl(): Promise<string | null> {
  const settings = await loadSettings();
  const url = obj(settings.site_icon).url;
  return typeof url === "string" && isHttpUrl(url) ? url : null;
}

/** Frase default animasi ketik dashboard (bila pengaturan belum ada). */
export const DEFAULT_TYPEWRITER_PHRASES = [
  "Selamat datang di DeepCrips Hub",
  "Kelola konten dalam satu tempat",
  "Pantau aktivitas komunitas",
];

/**
 * Frase untuk animasi ketik di dashboard admin.
 * `null` = pengaturan belum pernah disimpan (pakai default),
 * `[]` = admin mengosongkan (matikan animasi → judul statis).
 */
export async function getTypewriterPhrases(): Promise<string[] | null> {
  const settings = await loadSettings();
  if (!("dashboard_typewriter" in settings)) return null;
  const raw = obj(settings.dashboard_typewriter).phrases;
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
    .slice(0, 6)
    .map((p) => p.slice(0, 120));
}

export interface SocialLink {
  key: string;
  label: string;
  url: string;
}

const SOCIAL_LABELS: Array<{ key: string; label: string }> = [
  { key: "youtube", label: "YouTube" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "discord", label: "Discord" },
  { key: "telegram", label: "Telegram" },
  { key: "github", label: "GitHub" },
  { key: "twitch", label: "Twitch" },
];

/** Daftar tautan media sosial yang terisi (urut, hanya URL valid https). */
export async function getSocialLinks(): Promise<SocialLink[]> {
  const settings = await loadSettings();
  const map = obj(settings.social_links);
  const out: SocialLink[] = [];
  for (const { key, label } of SOCIAL_LABELS) {
    const url = map[key];
    if (typeof url === "string" && isHttpUrl(url)) out.push({ key, label, url });
  }
  return out;
}

/** Toggle "tampilkan konten template" (default: mati). */
export async function templatesEnabled(): Promise<boolean> {
  const settings = await loadSettings();
  return obj(settings.show_templates).enabled === true;
}
