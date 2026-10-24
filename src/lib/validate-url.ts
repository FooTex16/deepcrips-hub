/**
 * Validasi URL host unduhan — mencegah SSRF dan input berbahaya.
 * Diterapkan di sisi server (API admin) sebelum URL disimpan.
 */

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/i,
  /^fe80:/i,
  /^fc00:/i,
  /^fd00:/i,
];

const BLOCKED_TLDS = [".local", ".internal", ".localhost", ".home", ".lan"];

export type UrlValidation = { ok: true; normalized: string } | { ok: false; error: string };

export function validateHostUrl(raw: string): UrlValidation {
  const url = raw.trim();
  if (!url) return { ok: false, error: "URL tidak boleh kosong." };
  if (url.length > 2048) return { ok: false, error: "URL terlalu panjang (maks 2048 karakter)." };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "URL tidak valid." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, error: "Hanya URL http(s) yang diizinkan." };
  }

  const host = parsed.hostname;
  if (!host) return { ok: false, error: "URL tidak memiliki host." };

  for (const p of PRIVATE_HOST_PATTERNS) {
    if (p.test(host)) {
      return { ok: false, error: "URL menunjuk ke host privat/lokal dan tidak diizinkan." };
    }
  }
  for (const tld of BLOCKED_TLDS) {
    if (host.toLowerCase().endsWith(tld)) {
      return { ok: false, error: `Host dengan akhiran ${tld} tidak diizinkan.` };
    }
  }

  // Normalisasi: buang hash, pertahankan query (sering berisi token unduhan).
  parsed.hash = "";
  return { ok: true, normalized: parsed.toString() };
}

/** Validasi URL gambar (cover/screenshot/thumbnail) — http(s) saja. */
export function validateImageUrl(raw: string): UrlValidation {
  const url = raw.trim();
  if (!url) return { ok: false, error: "URL gambar tidak boleh kosong." };
  if (url.length > 2048) return { ok: false, error: "URL terlalu panjang." };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { ok: false, error: "Hanya URL http(s) yang diizinkan." };
    }
    return { ok: true, normalized: parsed.toString() };
  } catch {
    return { ok: false, error: "URL gambar tidak valid." };
  }
}
