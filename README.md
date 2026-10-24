# DeepCrips Hub

Platform konten gaming & teknologi: katalog game, download (multi-host), tutorial, video YouTube, forum komunitas, permintaan konten, dan dashboard admin lengkap.

> **Jujur soal keamanan:** kami tidak mengklaim file 100% aman. Lihat [`/security`](src/app/security/page.tsx) dan [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md).

## Stack

| Layanan | Peran |
|---------|-------|
| **GitHub** | Kode sumber |
| **Vercel** | Hosting + serverless functions |
| **Supabase** | Postgres, Auth (Google OAuth), metadata, forum |

File besar (game/mod) disimpan di host eksternal (Drive / MediaFire / MEGA). Database hanya menyimpan **metadata + URL** — URL host disembunyikan dari publik dan hanya dialirkan lewat gerbang server.

## Fitur

- **Home** — hero, file unggulan, eksplorasi game, download terbaru + pembaruan versi, tutorial pilihan, video, diskusi forum.
- **Katalog Game** — daftar + detail per game dengan tab (Download / Tutorial / Video).
- **Katalog Download** — filter (game, jenis, tanggal, ketersediaan), detail dengan riwayat versi lengkap + multi-host, gerbang login, pencatatan klik.
- **Tutorial** — daftar + detail (Markdown aman, HTML di-escape).
- **Video** — daftar + detail (thumbnail statis / embed no-cookie, tanpa iframe pihak ketiga).
- **Pencarian Global** — server-side (PostgreSQL `global_search`), dikelompokkan per tipe, berpaginasi.
- **Forum** — topik, komentar berjenjang, 5 reaksi emoji, laporan, sortir, paginasi, moderasi.
- **Permintaan Konten** — 5 status, **satu suara per user** (dicegah di DB via composite PK).
- **Profil** — edit nama tampilan & bio, statistik singkat.
- **Admin** — ringkasan, game, file + versi + host, tutorial, video, unggulan, moderasi forum, laporan, permintaan, anggota & peran, pengaturan, log audit.
- **Tema** — gelap (default) & terang, tanpa flash, hormati `prefers-reduced-motion`.

## Mulai Cepat

```bash
npm install
cp .env.example .env.local   # lalu isi nilai Supabase & site URL
npm run dev                  # http://localhost:3000
```

Tanpa Supabase terkonfigurasi, situs tetap jalan dan menampilkan keadaan "konfigurasi belum lengkap" yang jujur — bukan data palsu.

## Perintah

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm run start` | jalankan build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |

> **Windows:** gunakan `npm.cmd` (bukan `npm.ps1`) bila kebijakan eksekusi PowerShell memblokir skrip.

## Environment

Salin `.env.example` → `.env.local` lalu isi. Detail di [`docs/SETUP.md`](docs/SETUP.md).

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✔ | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✔ | Anon key (publik, aman di frontend) |
| `SUPABASE_SERVICE_ROLE_KEY` | untuk unduhan & audit | **Rahasia** — hanya di server |
| `NEXT_PUBLIC_SITE_URL` | ✔ | URL produksi (mis. `https://deepcrips.vercel.app`) |
| `NEXT_PUBLIC_YOUTUBE_HANDLE` | – | Handle kanal YouTube (opsional) |

## Struktur

```
src/
  app/                 Halaman App Router + route API
    api/               download, forum, requests, search, admin/*, profile
    admin/             dashboard admin (12 section)
  components/
    ui/                kit komponen dasar (button, card, table, dialog, dll)
    admin/             komponen admin (tabel, form, resource manager)
    content/           kartu konten (file, game, tutorial, video, topic)
    forum/ requests/   komponen interaksi komunitas
  lib/
    data/              lapisan data (home, catalog, forum, requests, search, admin)
    supabase/          client anon (server/browser) + admin (service role)
    admin-crud.ts      factory CRUD admin generik (role check + audit)
    admin-schemas.ts   skema Zod + validasi URL host (anti-SSRF)
    validate-url.ts    validator URL host & gambar
supabase/migrations/   8 migrasi SQL (skema, RLS, fungsi pencarian)
docs/                  SETUP, DATABASE, DEPLOYMENT, LIMITATIONS
```

## Keamanan

- **RLS aktif** di semua tabel; otorisasi berlapis (RLS + pemeriksaan role di server).
- **Login Google-only** (OAuth 2.0) — tanpa kata sandi, tanpa penyimpanan email di frontend.
- **URL unduhan tersembunyi** dari publik; hanya mengalir lewat `/api/download/[hostId]` (validasi status published + versi available + host active).
- **Validasi URL host anti-SSRF** di server (blokir host privat/lokal).
- **Rahasia tidak di frontend** — service role hanya di environment server.
- **Rate limiting** per-IP/per-user di route sensitif (lihat `docs/LIMITATIONS.md`).
- **Audit log** append-only untuk tindakan sensitif, ditulis server-side.

Baca [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) untuk keterbatasan jujur (rate limit in-memory, dsb.).

## Lisensi

Konten & kode milik DeepCrips. Hormati hak cipta pihak ketiga pada file yang ditautkan.
