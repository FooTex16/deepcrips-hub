"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { AdminTable, RowButton } from "@/components/admin/admin-table";
import { AdminFormModal, type FieldDef, type FormValues } from "@/components/admin/admin-form";
import { useToast } from "@/components/ui/toast";

interface SettingRow {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updated_at: string;
}

const FIELDS: FieldDef[] = [
  {
    name: "key",
    label: "Key",
    type: "text",
    required: true,
    placeholder: "footer_links, announcement…",
    help: "Huruf kecil, angka, underscore, titik. Contoh: footer.discord_url",
  },
  {
    name: "value",
    label: "Nilai (JSON)",
    type: "textarea",
    rows: 5,
    required: true,
    placeholder: '{"discord": "https://discord.gg/…"}',
    help: "Harus berupa JSON valid. Tidak boleh menyimpan rahasia (password/token/api key).",
  },
  { name: "description", label: "Deskripsi", type: "text" },
];

async function api(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

export function SettingsManager() {
  const { toast } = useToast();
  const [rows, setRows] = React.useState<SettingRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SettingRow | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api("GET", "/api/admin/settings?limit=100");
      if (!r.ok) {
        setError(r.json?.error ?? "Gagal memuat pengaturan.");
        setLoading(false);
        return;
      }
      const items = ((r.json?.items ?? []) as Array<Omit<SettingRow, "id">>).map((s) => ({
        ...s,
        id: s.key,
      }));
      setRows(items);
    } catch {
      setError("Jaringan bermasalah.");
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const submit = async (values: FormValues) => {
    // Validasi JSON di client untuk pesan lebih cepat.
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(values.value || "{}"));
    } catch {
      setFormError("Nilai harus berupa JSON yang valid.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    const r = await api("PUT", `/api/admin/settings/${encodeURIComponent(String(values.key))}`, {
      key: values.key,
      value: parsed,
      description: values.description || null,
    });
    setSubmitting(false);
    if (r.ok) {
      toast("Pengaturan disimpan.", "success");
      setModalOpen(false);
      void load();
    } else setFormError(r.json?.error ?? "Gagal menyimpan.");
  };

  const remove = async (row: SettingRow) => {
    if (!window.confirm(`Hapus pengaturan “${row.key}”?`)) return;
    const r = await api("DELETE", `/api/admin/settings/${encodeURIComponent(row.key)}`);
    if (r.ok) {
      toast("Pengaturan dihapus.", "success");
      void load();
    } else toast(r.json?.error ?? "Gagal menghapus.", "error");
  };

  return (
    <div>
      <p className="mb-5 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-xs text-text-muted">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <span>
          <strong className="text-text">Penting:</strong> <code>site_settings</code> hanya untuk nilai
          non-rahasia (tautan komunitas, teks footer, pengumuman). Jangan pernah menyimpan password, API key,
          atau token di sini — gunakan environment variable server. Penggunaan rahasia di settings akan
          ditolak.
        </span>
      </p>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-colors hover:bg-brand-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Tambah pengaturan
        </button>
      </div>

      <AdminTable<SettingRow>
        columns={[
          { key: "key", header: "Key", render: (r) => <code className="text-xs font-medium">{r.key}</code> },
          {
            key: "value",
            header: "Nilai",
            render: (r) => (
              <span className="block max-w-md truncate font-mono text-xs text-text-faint" title={JSON.stringify(r.value)}>
                {JSON.stringify(r.value)}
              </span>
            ),
          },
          { key: "description", header: "Deskripsi", render: (r) => r.description ?? "—" },
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyMessage="Belum ada pengaturan."
        rowActions={(r) => (
          <>
            <RowButton
              onClick={() => {
                setEditing(r);
                setFormError(null);
                setModalOpen(true);
              }}
              tone="brand"
            >
              <Pencil className="h-3 w-3" aria-hidden /> Ubah
            </RowButton>
            <RowButton onClick={() => void remove(r)} tone="danger">
              <Trash2 className="h-3 w-3" aria-hidden /> Hapus
            </RowButton>
          </>
        )}
      />

      <AdminFormModal
        open={modalOpen}
        title={editing ? `Ubah ${editing.key}` : "Tambah pengaturan"}
        fields={FIELDS}
        initialValues={
          editing
            ? { key: editing.key, value: JSON.stringify(editing.value, null, 2), description: editing.description ?? "" }
            : undefined
        }
        onSubmit={(v) => void submit(v)}
        onClose={() => setModalOpen(false)}
        submitting={submitting}
        error={formError}
      />
    </div>
  );
}
