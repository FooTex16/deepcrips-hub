# Keterbatasan (Jujur)

Kami lebih suka menjelaskan keterbatasan daripada membuat klaim berlebihan. Halaman publik [`/security`](../src/app/security/page.tsx) merangkum ini untuk pengguna akhir.

---

## Yang TIDAK dapat kami jamin

- **File 100% bebas malware.** Kami tidak memindai file dengan antivirus pihak ketiga secara otomatis. Pemeriksaan dilakukan **manual oleh admin** (kolom `check_status` + `check_notes`). Verifikasi pengguna tetap diperlukan.
- **Ketersediaan konten pihak ketiga.** File dihosting di Drive/MediaFire/MEGA dapat dihapus/diubah oleh pemiliknya di luar kendali kami.

## Rate limiting

- Implementasi di `src/lib/rate-limit.ts` memakai **sliding-window in-memory per-instance**.
- Di **Vercel serverless**, setiap instance function punya memori sendiri → **batas per-IP tidak konsisten antar-instance** dan dapat di-reset saat cold start.
- Ini memadai untuk penggunaan komunitas skala kecil–menengah, tetapi **bukan** pengganti WAF / rate-limit terdistribusi (mis. Cloudflare) bila trafik besar atau serangan.

## Autentikasi & sesi

- Login sepenuhnya ditangani **Google OAuth 2.0** — kami tidak menyimpan kata sandi.
- Bila **perangkat pengguna terinfeksi**, sesi login dapat disalahgunakan. Saran: keluar dari akun di perangkat bersama.
- Kami **tidak** menerapkan mekanisme deteksi anomali sesi / 2FA tambahan (keterbatasan Google-only login).

## Data & privasi

- Data tersimpan: email Google (di `auth.users`, **tidak pernah** dikirim ke frontend), nama tampilan, foto profil, bio, dan aktivitas komunitas (topik, komentar, suara, laporan).
- Unduhan dicatat sebagai **klik** (`download_events`) untuk statistik internal — bukan klaim unduhan sukses, bukan pelacakan identitas via file.
- Kami **tidak** menjalankan cookie tracking pihak ketiga / analytics eksternal secara default.

## Otorisasi berlapis (dan celah yang mungkin)

- **RLS aktif** di seluruh tabel + **pemeriksaan peran di server** (route handler memanggil `requireAdmin(role)`).
- Namun: `createAdminClient()` (service role) **melewati RLS**. Setiap pemanggil wajib melakukan otorisasi manual sebelum memakai hasilnya. Celah otorisasi di route handler baru akan menjadi risiko nyata — karena itu audit log ditulis untuk semua aksi sensitif.
- Peran di mirror di client (`useAuth()`) hanya untuk UX; **otorisasi sebenarnya selalu di server**.

## Validasi URL host (anti-SSRF)

- `src/lib/validate-url.ts` memblokir host privat/lokal (`localhost`, `127.*`, `10.*`, `172.16–31.*`, `192.168.*`, `169.254.*`, `::1`, `fc00/fd00/fe80`, `.local`, `.internal`, dll.) dan hanya mengizinkan `http(s)`.
- Ini mengurangi risiko SSRF, tetapi **bukan pengganti egress filtering** di tingkat jaringan bila server Anda dapat diarahkan ke metadata cloud (mis. `169.254.169.254` sudah diblokir, tetapi pola lain mungkin muncul).

## Markdown & XSS

- Tutorial memakai parser Markdown ringan yang **meng-escape semua HTML** (`src/lib/markdown.ts`) → konten admin tidak dapat menyuntikkan skrip.
- Reaksi, komentar, dan permintaan dirender sebagai **teks polos** (bukan `dangerouslySetInnerHTML`).

## Tanpa data palsu

- Bila Supabase belum terkonfigurasi / gagal dihubungi, lapisan data **gagal dengan angggun** (mengembalikan `[]` / `null`), dan UI menampilkan **`ConfigMissingState` / empty state yang jujur** — **tidak pernah** data dummy atau placeholder yang menyesatkan.

---

## Jika Anda membutuhkan jaminan lebih

Untuk produksi berskala besar atau threat model serius, pertimbangkan menambahkan:
- Rate-limit terdistribusi (Cloudflare / Upstash Redis).
- Pemindaian file otomatis (ClamAV atau VirusTotal API) sebelum publish.
- Notifikasi perubahan host / URL unduhan.
- Monitoring & alerting (error tracking, uptime).
- Review keamanan independen.
