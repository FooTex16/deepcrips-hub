"use client";

import * as React from "react";
import { Section } from "@/components/layout/section";
import { ResourceAdmin } from "@/components/admin/resource-admin";
import { fetchOptions } from "@/components/admin/use-resource";
import { StatusBadge } from "@/components/admin/admin-table";
import { formatDate } from "@/lib/utils";
import { CONTENT_STATUS_META } from "@/lib/types";
import type { FieldDef } from "@/components/admin/admin-form";

interface TutorialRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  published_at: string | null;
  game: { id: string; title: string } | null;
}

export default function AdminTutorialsPage() {
  const [games, setGames] = React.useState<Array<{ id: string; title: string }>>([]);
  React.useEffect(() => {
    void (async () => {
      setGames(await fetchOptions<{ id: string; title: string }>("/api/admin/games"));
    })();
  }, []);

  const fields: FieldDef[] = React.useMemo(
    () => [
      { name: "title", label: "Judul", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "text", placeholder: "kosongkan untuk otomatis" },
      {
        name: "game_id",
        label: "Game terkait",
        type: "select",
        options: [
          { value: "", label: "— Tanpa game —" },
          ...games.map((g) => ({ value: g.id, label: g.title })),
        ],
      },
      { name: "category", label: "Kategori", type: "text", required: true, placeholder: "umum, modding, tips…" },
      { name: "summary", label: "Ringkasan", type: "textarea", rows: 2 },
      {
        name: "body",
        label: "Isi tutorial (Markdown)",
        type: "textarea",
        rows: 12,
        help: "Dukungan Markdown ringan: **tebal**, *miring*, `kode`, daftar, kutipan. HTML di-escape otomatis.",
      },
      { name: "cover_url", label: "URL cover (opsional)", type: "text", placeholder: "https://…" },
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
      <ResourceAdmin<TutorialRow>
        endpoint="/api/admin/tutorials"
        title="Tutorial"
        description="Kelola tutorial. Body mendukung Markdown ringan (HTML di-escape)."
        searchPlaceholder="Cari judul / kategori…"
        columns={[
          { key: "title", header: "Judul", render: (r) => <span className="font-medium">{r.title}</span> },
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
          game_id: r.game?.id ?? "",
          category: r.category,
          summary: "",
          body: "",
          cover_url: "",
          status: r.status,
        })}
      />
    </Section>
  );
}
