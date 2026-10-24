import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CREATOR_HANDLE, SITE_NAME, SITE_TAGLINE } from "@/lib/utils";
import { BrandMark } from "@/components/brand/logo";
import { YoutubeIcon } from "@/components/brand/youtube-icon";

async function getCommunityLinks(): Promise<{ discord: string | null; telegram: string | null; youtube: string | null }> {
  const fallbackYoutube = process.env.NEXT_PUBLIC_YOUTUBE_HANDLE
    ? `https://www.youtube.com/@${process.env.NEXT_PUBLIC_YOUTUBE_HANDLE}`
    : null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["discord_url", "telegram_url", "youtube_url"]);
    const map = new Map<string, string>();
    for (const row of data ?? []) {
      const url = (row.value as { url?: string } | null)?.url;
      if (url && /^https?:\/\//.test(url)) map.set(row.key, url);
    }
    return {
      discord: map.get("discord_url") ?? null,
      telegram: map.get("telegram_url") ?? null,
      youtube: map.get("youtube_url") ?? fallbackYoutube,
    };
  } catch {
    return { discord: null, telegram: null, youtube: fallbackYoutube };
  }
}

const PRODUCT_LINKS = [
  { href: "/games", label: "Katalog Game" },
  { href: "/downloads", label: "Download" },
  { href: "/tutorials", label: "Tutorial" },
  { href: "/videos", label: "Video" },
];

const COMMUNITY_LINKS = [
  { href: "/forum", label: "Forum" },
  { href: "/requests", label: "Permintaan Konten" },
];

const INFO_LINKS = [
  { href: "/policies", label: "Kebijakan" },
  { href: "/security", label: "Informasi Keamanan" },
  { href: "/search", label: "Pencarian" },
];

export async function Footer() {
  const links = await getCommunityLinks();

  return (
    <footer className="mt-auto border-t border-border bg-bg-subtle">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BrandMark size={30} />
              <span className="text-[15px] font-bold tracking-tight text-text">
                DeepCrips <span className="text-gradient-brand">Hub</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{SITE_TAGLINE}</p>
            <p className="mt-3 text-xs text-text-faint">
              Konten oleh {CREATOR_HANDLE}
            </p>
          </div>

          <nav aria-label="Produk">
            <h2 className="mb-3 text-sm font-semibold text-text">Produk</h2>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted transition-colors hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Komunitas">
            <h2 className="mb-3 text-sm font-semibold text-text">Komunitas</h2>
            <ul className="space-y-2.5">
              {COMMUNITY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted transition-colors hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
              {links.discord && (
                <li>
                  <a
                    href={links.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Discord
                  </a>
                </li>
              )}
              {links.telegram && (
                <li>
                  <a
                    href={links.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    Telegram
                  </a>
                </li>
              )}
              {links.youtube && (
                <li>
                  <a
                    href={links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text"
                  >
                    <YoutubeIcon className="h-4 w-4" />
                    YouTube {CREATOR_HANDLE}
                  </a>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-label="Informasi">
            <h2 className="mb-3 text-sm font-semibold text-text">Informasi</h2>
            <ul className="space-y-2.5">
              {INFO_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-text-muted transition-colors hover:text-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE_NAME}. Konten &amp; brand oleh {CREATOR_HANDLE}.
          </p>
          <p>
            File unduhan disediakan lewat host eksternal. Baca{" "}
            <Link href="/security" className="underline-offset-2 hover:text-text hover:underline">
              informasi keamanan
            </Link>{" "}
            sebelum mengunduh.
          </p>
        </div>
      </div>
    </footer>
  );
}
