import { ImageResponse } from "next/og";
import { getSiteIconUrl } from "@/lib/data/settings";

/**
 * Ikon tab (favicon) dinamis: mengikuti pengaturan admin (site_icon.url).
 * Dinonaktifkan → ikon bawaan DeepCrips Hub (gradien brand→cyan, huruf DC).
 *
 * Route ini di-cache 5 menit — mengganti ikon di panel pengaturan cukup
 * menunggu ≤5 menit, tanpa redeploy.
 */
export const revalidate = 300;

export default async function Icon(): Promise<Response> {
  const url = await getSiteIconUrl();

  if (url) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8_000);
      const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
      const contentType = res.headers.get("content-type");
      const buf = await res.arrayBuffer();
      if (res.ok && buf.byteLength > 0 && (!contentType || contentType.startsWith("image/"))) {
        return new Response(buf, {
          headers: {
            "content-type": contentType ?? "image/png",
            "cache-control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
          },
        });
      }
    } catch {
      /* jatuh ke ikon bawaan */
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #2f7dff 0%, #22d3ee 100%)",
          color: "#ffffff",
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        DC
      </div>
    ),
    { width: 64, height: 64 }
  );
}
