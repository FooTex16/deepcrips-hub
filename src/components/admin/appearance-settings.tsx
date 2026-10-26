"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ImageInput } from "@/components/admin/image-input";
import { useToast } from "@/components/ui/toast";
import { isHttpUrl, cn } from "@/lib/utils";

const SOCIAL_FIELDS = [
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@DeepCrips" },
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/…" },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@…" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/…" },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/…" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/…" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/…" },
  { key: "twitch", label: "Twitch", placeholder: "https://www.twitch.tv/…" },
] as const;

const DEFAULT_PHRASES = [
  "Selamat datang di DeepCrips Hub",
  "Kelola konten dalam satu tempat",
  "Pantau aktivitas komunitas",
].join("\n");

const inputCls =
  "h-[42px] w-full rounded-xl border border-border bg-bg-subtle px-3.5 text-sm text-text placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-60";

/**
 * Panel pengaturan tampilan (ramah admin): ikon tab, teks animasi ketik
 * dashboard, media sosial di bawah dashboard, dan toggle konten template.
 * Menulis 4 key site_settings sekaligus.
 */
export function AppearanceSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [iconUrl, setIconUrl] = React.useState("");
  const [phrases, setPhrases] = React.useState(DEFAULT_PHRASES);
  const [socials, setSocials] = React.useState<Record<string, string>>({});
  const [templatesOn, setTemplatesOn] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch("/api/admin/settings?limit=100");
        const json = (await res.json().catch(() => ({}))) as {
          items?: Array<{ key: string; value: Record<string, unknown> | null }>;
        };
        if (!alive) return;
        const items = json.items ?? [];
        const get = (k: string): Record<string, unknown> => {
          const v = items.find((i) => i.key === k)?.value;
          return v && typeof v === "object" && !Array.isArray(v) ? v : {};
        };
        if (items.some((i) => i.key === "site_icon")) {
          setIconUrl(typeof get("site_icon").url === "string" ? String(get("site_icon").url) : "");
        }
        if (items.some((i) => i.key === "dashboard_typewriter")) {
          const raw = get("dashboard_typewriter").phrases;
          setPhrases(
            Array.isArray(raw)
              ? raw.filter((p): p is string => typeof p === "string").join("\n")
              : ""
          );
        }
        const socialRaw = get("social_links");
        const socialInit: Record<string, string> = {};
        for (const f of SOCIAL_FIELDS) {
          const v = socialRaw[f.key];
          socialInit[f.key] = typeof v === "string" ? v : "";
        }
        setSocials(socialInit);
        setTemplatesOn(get("show_templates").enabled === true);
      } catch {
        /* pakai nilai awal */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const put = (key: string, value: Record<string, unknown>, description: string) =>
    fetch(`/api/admin/settings/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value, description }),
    });

  const save = async () => {
    setSaving(true);
    setError(null);

    const socialsPayload: Record<string, string> = {};
    for (const f of SOCIAL_FIELDS) {
      const v = (socials[f.key] ?? "").trim();
      if (!v) continue;
      if (!isHttpUrl(v)) {
        setSaving(false);
        setError(`URL ${f.label} tidak valid — harus diawali http:// atau https://.`);
        return;
      }
      socialsPayload[f.key] = v;
    }

    const phrasesList = phrases
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .slice(0, 6);

    try {
      const results = await Promise.all([
        put(
          "site_icon",
          { url: iconUrl.trim() },
          "Ikon tab (favicon) situs — kosongkan untuk ikon bawaan."
        ),
        put(
          "dashboard_typewriter",
          { phrases: phrasesList },
          "Frase animasi ketik di dashboard admin (satu per baris)."
        ),
        put("social_links", socialsPayload, "Media sosial yang tampil di bawah dashboard admin."),
        put(
          "show_templates",
          { enabled: templatesOn },
          "Tampilkan konten template contoh di halaman publik."
        ),
      ]);
      const failed = results.find((r) => !r.ok);
      if (failed) {
        const j = (await failed.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Gagal menyimpan pengaturan.");
        return;
      }
      toast("Pengaturan tampilan disimpan.", "success");
    } catch {
      setError("Jaringan bermasalah.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-text">
          <Sparkles className="h-4 w-4 text-brand" aria-hidden />
          Tampilan situs
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Ikon tab, teks animasi ketik dashboard, dan media sosial di bawah dashboard.
        </p>

        <div className={cn("mt-5 space-y-5", loading && "pointer-events-none opacity-60")}>
          {/* Ikon tab */}
          <div>
            <label htmlFor="appearance-icon" className="mb-1.5 block text-sm font-medium text-text">
              Ikon situs (tab browser)
            </label>
            <ImageInput
              value={iconUrl}
              onChange={setIconUrl}
              disabled={loading || saving}
              placeholder="https://… (kosongkan untuk ikon bawaan DC)"
              inputClassName={inputCls}
            />
            <p className="mt-1 text-xs text-text-faint">
              Unggah PNG/ICO, atau tempel URL. Perubahan tampil dalam ≤5 menit tanpa redeploy.
            </p>
          </div>

          {/* Frase typewriter */}
          <div>
            <label htmlFor="appearance-phrases" className="mb-1.5 block text-sm font-medium text-text">
              Teks animasi ketik (dashboard)
            </label>
            <textarea
              id="appearance-phrases"
              value={phrases}
              onChange={(e) => setPhrases(e.target.value)}
              rows={4}
              placeholder={DEFAULT_PHRASES}
              disabled={loading || saving}
              className={cn(inputCls, "h-auto min-h-[96px] py-2.5")}
            />
            <p className="mt-1 text-xs text-text-faint">
              Satu kalimat per baris (maksimal 6) — diketik bergantian. Kosongkan untuk mematikan
              animasi.
            </p>
          </div>

          {/* Media sosial */}
          <div>
            <p className="mb-2 text-sm font-medium text-text">Media sosial (bawah dashboard)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-text-muted">{f.label}</span>
                  <input
                    type="text"
                    value={socials[f.key] ?? ""}
                    onChange={(e) => setSocials((s) => ({ ...s, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    disabled={loading || saving}
                    className={inputCls}
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-faint">Kosongkan untuk menyembunyikan platform.</p>
          </div>
        </div>
      </div>

      {/* Toggle konten template */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text">Konten template (pratinjau)</h3>
            <p className="mt-1 max-w-2xl text-sm text-text-muted">
              Saat aktif, halaman publik (download, tutorial, video, forum, game) dilengkapi konten
              <span className="font-medium text-text"> contoh </span>
              agar terlihat gambaran website ketika sudah terisi. Konten asli tetap tampil — template
              hanya ditambahkan, tidak pernah menimpa atau menghapus postingan nyata. Saat mati,
              hanya template yang hilang.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={templatesOn}
            aria-label="Tampilkan konten template"
            onClick={() => setTemplatesOn((v) => !v)}
            disabled={loading || saving}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
              templatesOn ? "bg-brand" : "bg-border-strong"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                templatesOn ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>
        <p className={cn("mt-3 text-sm font-medium", templatesOn ? "text-success" : "text-text-faint")}>
          {templatesOn ? "Aktif — pengunjung melihat isi contoh." : "Matif — hanya konten asli yang tampil."}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg transition-all hover:bg-brand-hover active:scale-[0.98] disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Simpan pengaturan tampilan
        </button>
      </div>
    </div>
  );
}
