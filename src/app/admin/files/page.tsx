"use client";

import * as React from "react";
import { Section } from "@/components/layout/section";
import { ResourceAdmin } from "@/components/admin/resource-admin";
import { fetchOptions } from "@/components/admin/use-resource";
import { StatusBadge } from "@/components/admin/admin-table";
import { formatDate } from "@/lib/utils";
import { CONTENT_STATUS_META, CHECK_STATUS_META, FILE_CATEGORIES } from "@/lib/types";
import type { FieldDef } from "@/components/admin/admin-form";

interface FileRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  check_status: string;
  status: string;
  published_at: string | null;
  game: { id: string; title: string } | null;
  versions: Array<{ id: string; version_label: string; is_latest: boolean; status: string }> | null;
}

export default function AdminFilesPage() {
  const [games, setGames] = React.useState<Array<{ id: string; title: string }>>([]);
  React.useEffect(() => {
    void (async () => {
      const g = await fetchOptions<{ id: string; title: string }>("/api/admin/games");
      setGames(g);
    })();
  }, []);

  const fields: FieldDef[] = React.useMemo(
    () => [
      { name: "title", label: "Judul file", type: "text", required: true },
      {
        name: "slug",
        label: "Slug (URL)",
        type: "text",
        placeholder: "kosongkan untuk otomatis",
        help: "Dibuat otomatis dari judul bila kosong.",
      },
      {
        name: "game_id",
        label: "Game terkait",
        type: "select",
        options: [
          { value: "", label: "— Tanpa game —" },
          ...games.map((g) => ({ value: g.id, label: g.title })),
        ],
      },
      {
        name: "category",
        label: "Jenis file",
        type: "select",
        required: true,
        options: FILE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      },
      { name: "summary", label: "Ringkasan", type: "textarea", rows: 2, help: "Maks 400 karakter." },
      { name: "description", label: "Deskripsi", type: "textarea", rows: 5 },
      { name: "size_bytes", label: "Ukuran (byte)", type: "number", min: "0", help: "Kosongkan bila tidak diketahui." },
      { name: "source_info", label: "Informasi sumber", type: "textarea", rows: 2 },
      {
        name: "check_status",
        label: "Status pemeriksaan",
        type: "select",
        required: true,
        options: Object.entries(CHECK_STATUS_META).map(([v, m]) => ({ value: v, label: m.label })),
      },
      { name: "check_notes", label: "Catatan pemeriksaan", type: "textarea", rows: 2 },
      {
        name: "security_notes",
        label: "Catatan keamanan",
        type: "textarea",
        rows: 3,
        help: "Tampil di halaman publik. Jujurlah — jangan klaim 100% aman.",
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
      <ResourceAdmin<FileRow>
        endpoint="/api/admin/files"
        title="File & Versi"
        description="Kelola metadata file unduhan. Setelah membuat file, buka “Versi” untuk menambah riwayat versi dan host."
        searchPlaceholder="Cari judul / slug…"
        columns={[
          { key: "title", header: "Judul", render: (r) => <span className="font-medium">{r.title}</span> },
          { key: "game", header: "Game", render: (r) => r.game?.title ?? "—" },
          { key: "category", header: "Jenis", render: (r) => r.category },
          {
            key: "check_status",
            header: "Pemeriksaan",
            render: (r) => <StatusBadge value={r.check_status} meta={CHECK_STATUS_META} />,
            hideMobile: true,
          },
          {
            key: "versions",
            header: "Versi",
            render: (r) => (
              <span className="text-xs text-text-faint">
                {r.versions?.length ?? 0} versi
                {r.versions?.some((v) => v.is_latest) &&
                  ` · v${r.versions.find((v) => v.is_latest)?.version_label}`}
              </span>
            ),
          },
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
          description: "",
          size_bytes: "",
          source_info: "",
          check_status: r.check_status,
          check_notes: "",
          security_notes: "",
          status: r.status,
        })}
        extraActions={(r) => <VersionLink fileId={r.id} title={r.title} />}
      />
    </Section>
  );
}

function VersionLink({ fileId, title }: { fileId: string; title: string }) {
  return (
    <a
      href={`/admin/files/${fileId}`}
      className="inline-flex h-7 items-center rounded-lg border border-brand/40 px-2.5 text-xs font-medium text-brand transition-colors hover:bg-brand-soft"
      title={`Kelola versi ${title}`}
    >
      Versi
    </a>
  );
}
