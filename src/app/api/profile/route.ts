import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUser, parseBody, cleanText, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * PATCH /api/profile — perbarui profil milik sendiri (display_name & bio saja).
 * Kolom lain (roles, email) tidak dapat diubah sendiri.
 */
export async function PATCH(request: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`profile:update:${user.id}`, 10, 60_000);
  if (!limit.ok) return jsonError("Terlalu banyak permintaan. Tunggu sebentar.", 429);

  const body = await parseBody(
    request,
    z.object({
      display_name: cleanText(60).refine((s) => s.length >= 2, "Nama tampilan minimal 2 karakter."),
      bio: z
        .string()
        .max(280, "Bio maksimal 280 karakter.")
        .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim())
        .or(z.literal(""))
        .nullable()
        .optional(),
    })
  );
  if ("response" in body) return body.response;

  const supabase = await createClient();
  const patch: Record<string, string | null> = { display_name: body.data.display_name };
  if (body.data.bio !== undefined) patch.bio = body.data.bio || null;

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) return jsonError("Profil gagal diperbarui. Nama tampilan mungkin sudah dipakai.", 409);

  return jsonOk();
}
