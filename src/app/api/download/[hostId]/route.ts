import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Gerbang download.
 *
 * - WAJIB login (PRD: login adalah gerbang download).
 * - Memeriksa versi tersedia + host aktif & sehat di server.
 * - Mencatat klik sebagai download_events (KLIK, bukan klaim unduhan sukses).
 * - Rate limit per user + per host.
 * - URL host tidak pernah dikirim ke browser sebelum semua pemeriksaan lolos.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ hostId: string }> }
) {
  const { hostId } = await params;

  const user = await getAuthUser();
  if (!user) {
    // Kembalikan ke login dengan tujuan asli.
    const url = new URL(request.url);
    const next = url.pathname;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url.origin));
  }

  const perUser = rateLimit(`download:user:${user.id}`, 20, 60_000);
  if (!perUser.ok) {
    return jsonError(
      `Terlalu banyak permintaan unduhan. Coba lagi dalam ${perUser.retryAfterSeconds} detik.`,
      429
    );
  }
  const perHost = rateLimit(`download:host:${hostId}`, 30, 60_000);
  if (!perHost.ok) {
    return jsonError("Terlalu banyak permintaan untuk host ini. Coba lagi sebentar lagi.", 429);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonError(
      "Fitur unduhan belum dikonfigurasi di server (SUPABASE_SERVICE_ROLE_KEY belum diatur).",
      503
    );
  }

  const supabase = createAdminClient();

  const { data: host, error } = await supabase
    .from("download_hosts")
    .select(
      "id, url, is_active, status, file_version_id, " +
        "version:file_versions!inner(id, version_label, status, file_id, file:files!file_versions_file_id_fkey(id, slug, title, status))"
    )
    .eq("id", hostId)
    .maybeSingle();

  if (error || !host) {
    return NextResponse.redirect(new URL("/downloads?error=not-found", request.url));
  }

  const row = host as unknown as {
    id: string;
    url: string;
    is_active: boolean;
    status: string;
    file_version_id: string;
    version: {
      id: string;
      version_label: string;
      status: string;
      file_id: string;
      file: { id: string; slug: string; title: string; status: string };
    };
  };

  // Pemeriksaan status di SERVER: file published, versi tersedia, host aktif.
  const fileOk = row.version?.file?.status === "published";
  const versionOk = row.version?.status === "available";
  const hostOk = row.is_active && row.status === "active";

  if (!fileOk || !versionOk || !hostOk) {
    const reason = !fileOk ? "file" : !versionOk ? "version" : "host";
    return NextResponse.redirect(
      new URL(`/downloads/${row.version.file.slug}?error=unavailable&reason=${reason}`, request.url)
    );
  }

  // Catat KLIK (bukan klaim unduhan sukses). Tanpa IP/email.
  const { error: insertError } = await supabase.from("download_events").insert({
    file_id: row.version.file_id,
    file_version_id: row.version.id,
    host_id: row.id,
    user_id: user.id,
  });
  if (insertError) {
    // Pencatatan klik best-effort — redirect tetap dilanjutkan karena
    // pemeriksaan status di atas sudah menjadi gerbang yang sesungguhnya.
    console.error("[download] gagal mencatat klik:", insertError.message);
  }

  return NextResponse.redirect(row.url, { status: 302, headers: { "Referrer-Policy": "no-referrer" } });
}
