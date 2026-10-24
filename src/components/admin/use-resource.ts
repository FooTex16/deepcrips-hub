"use client";

import * as React from "react";

export interface ResourceState<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}

/**
 * Hook CRUD generik untuk halaman admin — memanggil API /api/admin/*.
 * Menangani loading, error, refresh, dan pesan suara (toast via callback).
 */
export function useResource<T extends { id: string }>(endpoint: string) {
  const [state, setState] = React.useState<ResourceState<T>>({
    items: [],
    count: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (params: Record<string, string | number | undefined> = {}) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== "") qs.set(k, String(v));
        }
        const res = await fetch(`${endpoint}?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(json?.error ?? "Gagal memuat data.");
          setState((s) => ({ ...s, items: [], count: 0 }));
          return;
        }
        setState({
          items: (json?.items ?? []) as T[],
          count: (json?.count ?? 0) as number,
          page: (json?.page ?? 1) as number,
          totalPages: (json?.totalPages ?? 1) as number,
        });
      } catch {
        setError("Jaringan bermasalah. Coba lagi.");
      }
      setLoading(false);
    },
    [endpoint]
  );

  const mutate = React.useCallback(
    async (
      method: "POST" | "PATCH" | "DELETE" | "PUT",
      body: unknown,
      id?: string
    ): Promise<{ ok: boolean; error?: string; item?: T }> => {
      try {
        const url = id ? `${endpoint}/${id}` : endpoint;
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          ...(method === "DELETE" ? {} : { body: JSON.stringify(body) }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, error: json?.error ?? "Operasi gagal." };
        return { ok: true, item: json?.item as T | undefined };
      } catch {
        return { ok: false, error: "Jaringan bermasalah. Coba lagi." };
      }
    },
    [endpoint]
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  return { ...state, loading, error, reload: load, mutate };
}

/** Ambil daftar entitas terkait (mis. semua game untuk dropdown). */
export async function fetchOptions<T extends { id: string; title?: string; slug?: string }>(
  endpoint: string
): Promise<T[]> {
  try {
    const res = await fetch(`${endpoint}?limit=100`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    return (json?.items ?? []) as T[];
  } catch {
    return [];
  }
}
