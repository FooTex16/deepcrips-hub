import { createClient } from "@/lib/supabase/server";
import { requireUser, jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/requests/[id]/vote — beri satu suara dukungan.
 * Pencegahan suara ganda: primary key komposit (request_id, user_id)
 * di database — endpoint ini menangani duplikat secara idempoten.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const limit = rateLimit(`request:vote:${user.id}`, 30, 60_000);
  if (!limit.ok) {
    return jsonError("Terlalu banyak permintaan suara. Tunggu sebentar.", 429);
  }

  const supabase = await createClient();

  const { data: req } = await supabase
    .from("content_requests")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!req) return jsonError("Permintaan tidak ditemukan.", 404);
  if ((req as { status: string }).status === "pending") {
    return jsonError("Permintaan belum ditinjau admin dan belum dapat didukung.", 403);
  }

  const { error } = await supabase
    .from("request_votes")
    .insert({ request_id: id, user_id: user.id });

  if (error && error.code !== "23505") {
    return jsonError("Gagal mencatat suara Anda.", 500);
  }

  // 23505 = sudah memilih (idempoten). Ambil jumlah suara terkini (oleh trigger).
  const { data: after } = await supabase
    .from("content_requests")
    .select("vote_count")
    .eq("id", id)
    .maybeSingle();

  return jsonOk(
    { vote_count: (after as { vote_count: number } | null)?.vote_count ?? null },
    { status: error ? 200 : 201 }
  );
}

/** DELETE /api/requests/[id]/vote — tarik dukungan. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("request_votes")
    .delete()
    .eq("request_id", id)
    .eq("user_id", user.id);

  if (error) return jsonError("Gagal menarik suara.", 500);

  const { data: after } = await supabase
    .from("content_requests")
    .select("vote_count")
    .eq("id", id)
    .maybeSingle();

  return jsonOk({ vote_count: (after as { vote_count: number } | null)?.vote_count ?? null });
}
