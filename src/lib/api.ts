import { NextResponse } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/auth";

/** Respons error JSON yang konsisten & tidak membocorkan detail internal. */
export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function jsonOk(data?: Record<string, unknown>, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init);
}

/** Ambil user login atau 401. */
export async function requireUser(): Promise<{ user: User } | { response: NextResponse }> {
  const user = await getAuthUser();
  if (!user) return { response: jsonError("Login diperlukan untuk tindakan ini.", 401) };
  return { user };
}

/**
 * Parse + validasi body JSON dengan Zod.
 * Mengembalikan pesan error validasi yang aman ditampilkan ke user.
 */
export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { response: jsonError("Body request bukan JSON yang valid.", 400) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first ? `${first.path.join(".") || "form"}: ${first.message}` : "Validasi gagal.";
    return { response: jsonError(message, 422) };
  }
  return { data: parsed.data };
}

/** Sanitasi teks bebas: trim + buang karakter kontrol. */
export const cleanText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
    .pipe(z.string().min(1, "Wajib diisi.").max(max, `Maksimal ${max} karakter.`));

/** URL http(s) saja. */
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "Harus berupa URL http/https yang valid.");

/** Slug URL-friendly. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Hanya huruf kecil, angka, dan tanda hubung.");
