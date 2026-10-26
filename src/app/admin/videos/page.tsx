"use client";

import * as React from "react";
import { Section } from "@/components/layout/section";
import { ResourceAdmin } from "@/components/admin/resource-admin";
import { fetchOptions } from "@/components/admin/use-resource";
import { StatusBadge } from "@/components/admin/admin-table";
import { formatDate } from "@/lib/utils";
import { CONTENT_STATUS_META } from "@/lib/types";
import type { FieldDef } from "@/components/admin/admin-form";
import { YoutubeImport } from "@/components/admin/youtube-import";

interface VideoRow {
  id: string;
  slug: string;
  title: string;
  video_url: string;
  category: string;
  status: string;
  published_at: string | null;
  game: { id: string; title: string } | null;
}

export default function AdminVideosPage() {
  const [games, setGames] = React.useState<Array<{ id: string; title: string }>>([]);
  React.useEffect(() => {
    void (async () => {
      setGames(await fetchOptions<{ id: string; title: string }>("/api/admin/games"));
    })();
  }, []);

  const fields: FieldDef[] = React.useMemo(
    () => [
      { name: "title", label: "Judul video", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "text", placeholder: "kosongkan untuk otomatis" },
      {
        name: "video_url",
        label: "URL YouTube",
        type: "text",
        required: true,
        placeholder: "https://youtube.com/watch?v=… atau youtu.be/…",
        help: "Harus tautan YouTube yang valid (watch, shorts, embed, atau youtu.be).",
      },
      { name: "thumbnail_url", label: "Thumbnail video (opsional)", type: "image", placeholder: "https://… atau unggah gambar" },
      { name: "category", label: "Kategori", type: "text", required: true, placeholder: "tutorial, gameplay…" },
      {
        name: "game_id",
        label: "Game terkait",
        type: "select",
        options: [
          { value: "", label: "— Tanpa game —" },
          ...games.map((g) => ({ value: g.id, label: g.title })),
        ],
      },
      { name: "description", label: "Deskripsi", type: "textarea", rows: 3 },
      {
        name: "duration_seconds",
        label: "Durasi (detik)",
        type: "number",
        min: "0",
        help: "Opsional. Kosongkan bila tidak diketahui.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: Object.entries(CONTENT_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
    ],
    [games]
  );

  return (
    <Section className="py-6 sm:py-8">
      <ResourceAdmin<VideoRow>
        endpoint="/api/admin/videos"
        title="Video"
        description="Kelola video YouTube — tarik video terbaru dari channel Anda dalam sekali klik, atau tambah manual."
        searchPlaceholder="Cari judul / kategori…"
        headerExtra={(reload) => <YoutubeImport onImported={reload} />}
        columns={[
          { key: "title", header: "Judul", render: (r) => <span className="font-medium">{r.title}</span> },
          {
            key: "video_url",
            header: "Tautan",
            render: (r) => (
              <a
                href={r.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-brand hover:underline"
                title={r.video_url}
              >
                buka di YouTube
              </a>
            ),
          },
          { key: "category", header: "Kategori", render: (r) => r.category },
          { key: "game", header: "Game", render: (r) => r.game?.title ?? "—" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} meta={CONTENT_STATUS_META} /> },
          {
            key: "published_at",
            header: "Terbit",
            render: (r) => (r.published_at ? formatDate(r.published_at) : "—"),
            hideMobile: true,
          },
        ]}
        fields={fields}
        rowToInitial={(r) => ({
          title: r.title,
          slug: r.slug,
          video_url: r.video_url,
          thumbnail_url: "",
          category: r.category,
          game_id: r.game?.id ?? "",
          description: "",
          duration_seconds: "",
          status: r.status,
        })}
      />
    </Section>
  );
}
