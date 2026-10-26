"use client";

import { Section } from "@/components/layout/section";
import { ResourceAdmin } from "@/components/admin/resource-admin";
import { StatusBadge } from "@/components/admin/admin-table";
import { formatDate } from "@/lib/utils";
import { CONTENT_STATUS_META } from "@/lib/types";
import type { FieldDef } from "@/components/admin/admin-form";

interface GameRow {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  summary: string | null;
  description: string | null;
  cover_url: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
}

const FIELDS: FieldDef[] = [
  { name: "title", label: "Judul", type: "text", required: true, placeholder: "Nama game" },
  {
    name: "slug",
    label: "Slug (URL)",
    type: "text",
    placeholder: "kosongkan untuk otomatis",
    help: "Huruf kecil, angka, dan tanda hubung. Dibuat otomatis dari judul bila kosong.",
  },
  { name: "genre", label: "Genre", type: "text", placeholder: "Contoh: MOBA, RPG" },
  { name: "summary", label: "Ringkasan", type: "textarea", rows: 2, help: "Maks 400 karakter." },
  { name: "description", label: "Deskripsi", type: "textarea", rows: 5 },
  { name: "cover_url", label: "Cover game (opsional)", type: "image", placeholder: "https://… atau unggah gambar" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: Object.entries(CONTENT_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
  },
];

export default function AdminGamesPage() {
  return (
    <Section className="py-6 sm:py-8">
      <ResourceAdmin<GameRow>
        endpoint="/api/admin/games"
        title="Game"
        description="Kelola katalog game. Ubah status ke “Published” untuk menampilkan di situs."
        searchPlaceholder="Cari judul / genre…"
        columns={[
          { key: "title", header: "Judul", render: (r) => <span className="font-medium">{r.title}</span> },
          { key: "slug", header: "Slug", render: (r) => <code className="text-xs text-text-faint">/{r.slug}</code> },
          { key: "genre", header: "Genre", render: (r) => r.genre ?? "—" },
          { key: "status", header: "Status", render: (r) => <StatusBadge value={r.status} meta={CONTENT_STATUS_META} /> },
          {
            key: "published_at",
            header: "Terbit",
            render: (r) => (r.published_at ? formatDate(r.published_at) : "—"),
            hideMobile: true,
          },
        ]}
        fields={FIELDS}
        rowToInitial={(r) => ({
          title: r.title,
          slug: r.slug,
          genre: r.genre ?? "",
          summary: r.summary ?? "",
          description: r.description ?? "",
          cover_url: r.cover_url ?? "",
          status: r.status,
        })}
      />
    </Section>
  );
}
