import type * as React from "react";
import { MessageCircle, Send } from "lucide-react";
import { GithubIcon, InstagramIcon, TiktokIcon, TwitchIcon, XIcon } from "@/components/brand/social-icons";
import { YoutubeIcon } from "@/components/brand/youtube-icon";
import type { SocialLink } from "@/lib/data/settings";

/** Ikon per platform — lucide untuk non-brand, svg inline untuk brand. */
type IconComp = (props: { className?: string }) => React.ReactElement;

const ICONS: Record<string, IconComp> = {
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  tiktok: TiktokIcon,
  x: XIcon,
  discord: MessageCircle as unknown as IconComp,
  telegram: Send as unknown as IconComp,
  github: GithubIcon,
  twitch: TwitchIcon,
};

/**
 * Deret pil media sosial (tautan keluar). Murni server — dipakai di
 * dashboard admin; hanya menampilkan link yang sudah diisi admin.
 */
export function SocialLinks({
  links,
  className,
}: {
  links: SocialLink[];
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2.5">
        {links.map((l) => {
          const Icon = ICONS[l.key] ?? Send;
          return (
            <a
              key={l.key}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="group inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-bg-subtle px-4 text-sm font-medium text-text-muted transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/40 hover:text-brand active:scale-[0.98]"
            >
              <Icon className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
              {l.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
