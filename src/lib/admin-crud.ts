import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, jsonError } from "@/lib/api";
import { getStaffContext } from "@/lib/auth";
import type { StaffContext } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";

export type AdminRole = "staff" | "content_admin" | "primary_admin";

const ROLE_RANK: Record<AdminRole, number> = { staff: 0, content_admin: 1, primary_admin: 2 };

/** Cek sesi + peran (dicek server-side; RLS tetap menjadi lapisan kedua). */
export async function requireAdmin(role: AdminRole): Promise<
  { user: { id: string }; staff: StaffContext } | { response: Response }
> {
  const auth = await requireUser();
  if ("response" in auth) return { response: auth.response };
  const staff = await getStaffContext();
  if (!staff) return { response: jsonError("Sesi tidak valid. Muat ulang halaman.", 401) };
  const allowed =
    role === "primary_admin"
      ? staff.isPrimaryAdmin
      : role === "content_admin"
        ? staff.isContentAdmin
        : staff.isStaff;
  if (!allowed) {
    return {
      response: jsonError("Anda tidak memiliki izin untuk tindakan ini.", 403),
    };
  }
  return { user: { id: auth.user.id }, staff };
}

export interface AdminListConfig {
  table: string;
  role: AdminRole;
  select?: string;
  /** Kolom yang dapat dicari dengan q (ilike). */
  searchColumns?: string[];
  /** Kolom yang dapat difilter persis via query param (whitelist). */
  filterColumns?: string[];
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface PagedRows<T> {
  items: T[];
  count: number;
  page: number;
  totalPages: number;
}

/** GET list dengan pencarian, filter, paginasi — semua lewat query param. */
export function makeAdminList(config: AdminListConfig) {
  return async function GET(request: Request): Promise<Response> {
    const guard = await requireAdmin(config.role);
    if ("response" in guard) return guard.response;

    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? config.limit ?? 20) || 20));

    try {
      const supabase = await createClient();
      let query = supabase.from(config.table).select(config.select ?? "*", { count: "exact" });

      if (q && config.searchColumns?.length) {
        const clean = q.replace(/[%_,()\\]/g, "");
        const or = config.searchColumns.map((c) => `${c}.ilike.%${clean}%`).join(",");
        query = query.or(or);
      }
      for (const col of config.filterColumns ?? []) {
        const v = url.searchParams.get(col);
        if (v) query = query.eq(col, v);
      }

      const order = config.orderBy ?? { column: "created_at", ascending: false };
      const from = (page - 1) * limit;
      const { data, count, error } = await query
        .order(order.column, { ascending: order.ascending ?? false })
        .range(from, from + limit - 1);

      if (error) return jsonError(`Gagal memuat data ${config.table}: ${error.message}`, 500);
      const total = count ?? 0;
      const payload: PagedRows<unknown> = {
        items: (data ?? []) as unknown[],
        count: total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
      return NextResponseJson(payload as unknown as Record<string, unknown>);
    } catch {
      return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
    }
  };
}

export interface AdminMutateConfig {
  table: string;
  entity: string;
  role: AdminRole;
  createSchema?: z.ZodTypeAny;
  updateSchema?: z.ZodTypeAny;
  select?: string;
  allowDelete?: boolean;
  /** Transformasi/validasi tambahan sebelum insert. Throw Error untuk menolak. */
  onCreate?: (data: Record<string, unknown>, ctx: { userId: string }) => Record<string, unknown>;
  onUpdate?: (
    data: Record<string, unknown>,
    ctx: { userId: string; id: string }
  ) => Record<string, unknown>;
  /** Sebelum delete — throw Error untuk menolak. */
  onDelete?: (ctx: { userId: string; id: string }) => Promise<void> | void;
}

/** POST create. */
export function makeAdminCreate(config: AdminMutateConfig) {
  return async function POST(request: Request): Promise<Response> {
    const guard = await requireAdmin(config.role);
    if ("response" in guard) return guard.response;
    const { user } = guard;

    const limit = rateLimit(`admin:create:${config.table}:${user.id}`, 30, 60_000);
    if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

    const body = await parseBody(request, config.createSchema ?? z.record(z.string(), z.unknown()));
    if ("response" in body) return body.response;

    let row: Record<string, unknown> = { ...(body.data as Record<string, unknown>) };
    try {
      if (config.onCreate) row = config.onCreate(row, { userId: user.id });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Validasi gagal.", 422);
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from(config.table)
        .insert(row)
        .select(config.select ?? "*")
        .single();
      if (error) return jsonError(`Gagal menyimpan: ${error.message}`, 400);
      await writeAuditLog({
        actorId: user.id,
        action: `${config.entity}.create`,
        entityType: config.table,
        entityId: (data as { id?: string } | null)?.id ?? null,
      });
      return NextResponseJson({ item: data }, 201);
    } catch {
      return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
    }
  };
}

/** PATCH update by id. */
export function makeAdminUpdate(config: AdminMutateConfig) {
  return async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<Response> {
    const { id } = await params;
    const guard = await requireAdmin(config.role);
    if ("response" in guard) return guard.response;
    const { user } = guard;

    const limit = rateLimit(`admin:update:${config.table}:${user.id}`, 60, 60_000);
    if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

    const body = await parseBody(request, config.updateSchema ?? z.record(z.string(), z.unknown()));
    if ("response" in body) return body.response;

    let row: Record<string, unknown> = { ...(body.data as Record<string, unknown>) };
    try {
      if (config.onUpdate) row = config.onUpdate(row, { userId: user.id, id });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Validasi gagal.", 422);
    }
    if (Object.keys(row).length === 0) return jsonError("Tidak ada perubahan.", 422);

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from(config.table)
        .update(row)
        .eq("id", id)
        .select(config.select ?? "*")
        .maybeSingle();
      if (error) return jsonError(`Gagal memperbarui: ${error.message}`, 400);
      if (!data) return jsonError(`${config.entity} tidak ditemukan.`, 404);
      await writeAuditLog({
        actorId: user.id,
        action: `${config.entity}.update`,
        entityType: config.table,
        entityId: id,
        metadata: { fields: Object.keys(row) },
      });
      return NextResponseJson({ item: data });
    } catch {
      return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
    }
  };
}

/** DELETE by id (opsional — hanya bila config.allowDelete). */
export function makeAdminDelete(config: AdminMutateConfig) {
  return async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<Response> {
    if (!config.allowDelete) return jsonError("Penghapusan tidak diizinkan untuk entitas ini.", 405);
    const { id } = await params;
    const guard = await requireAdmin(config.role);
    if ("response" in guard) return guard.response;
    const { user } = guard;

    try {
      if (config.onDelete) await config.onDelete({ userId: user.id, id });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : "Gagal menghapus.", 422);
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from(config.table)
        .delete()
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) return jsonError(`Gagal menghapus: ${error.message}`, 400);
      if (!data) return jsonError(`${config.entity} tidak ditemukan.`, 404);
      await writeAuditLog({
        actorId: user.id,
        action: `${config.entity}.delete`,
        entityType: config.table,
        entityId: id,
      });
      return NextResponseJson({ deleted: true });
    } catch {
      return jsonError("Klien database tidak tersedia. Periksa konfigurasi.", 503);
    }
  };
}

/** Respons JSON sederhana tanpa impor NextResponse berulang. */
function NextResponseJson(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export { ROLE_RANK };
