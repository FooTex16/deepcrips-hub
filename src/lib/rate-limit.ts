/**
 * Rate limiter in-memory (sliding window) untuk route handler.
 *
 * Catatan jujur: pada deployment serverless (Vercel), instance dapat
 * terpisah sehingga limit bersifat per-instance — lapisan proteksi dasar,
 * bukan jaminan global. Proteksi struktural (unique constraint, RLS)
 * tetap menjadi pertahanan utama di database.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Bersihkan bucket kadaluarsa sesekali agar memori tidak membengkak.
if (globalThis.__dcRateLimitCleanup === undefined) {
  globalThis.__dcRateLimitCleanup = setInterval(
    () => {
      const now = Date.now();
      for (const [key, bucket] of store) {
        if (bucket.resetAt <= now) store.delete(key);
      }
    },
    5 * 60 * 1000
  );
  // Jangan menahan event loop di environment serverless.
  (globalThis.__dcRateLimitCleanup as unknown as { unref?: () => void })?.unref?.();
}

declare global {
  var __dcRateLimitCleanup: NodeJS.Timeout | undefined;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param key    kunci unik, mis. "topic:create:<userId>"
 * @param limit  maksimal aksi dalam jendela
 * @param windowMs jendela waktu dalam ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Ambil IP client dari header request (untuk limit anon). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
