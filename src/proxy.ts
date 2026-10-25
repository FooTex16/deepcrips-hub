import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/utils";

/**
 * Proxy (pengganti middleware di Next.js 16) — memperbarui sesi Supabase
 * sebelum halaman dirender dan menjaga route privat.
 */

const PROTECTED_PREFIXES = ["/admin", "/profile"];

export async function proxy(request: NextRequest) {
  // Jika Supabase belum dikonfigurasi, lewati tanpa crash (error state
  // ditampilkan oleh halaman terkait).
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  // Hitung dulu kebutuhan proteksi & sesi.
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Jalan cepat: bukan route privat dan tidak ada sesi Supabase → tanpa kerja
  // Supabase sama sekali (browse anonim jadi murah di setiap request).
  const hasSession = request.cookies.getAll().some(({ name }) => name.startsWith("sb-"));
  if (!isProtected && !hasSession) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Penting: jalankan getUser() tanpa kode lain di antaranya.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", safeNextPath(`${pathname}${search}`));
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Jalankan untuk semua request kecuali aset statis.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
