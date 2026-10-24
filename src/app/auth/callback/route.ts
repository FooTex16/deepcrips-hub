import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/**
 * Callback OAuth Supabase (Google).
 * Menukar authorization code dengan sesi, lalu mengembalikan user ke
 * halaman/tindakan yang diminta (parameter `next` yang sudah divalidasi
 * aman dari open redirect).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"), "/");
  const origin = url.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, origin));
      }
      console.error("[auth] exchangeCodeForSession gagal:", error.message);
    } catch (err) {
      console.error("[auth] callback error:", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.redirect(new URL("/login?error=oauth", origin));
}
