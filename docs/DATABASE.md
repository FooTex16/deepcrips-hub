# Database & Migrasi

Skema DeepCrips Hub didefinisikan lewat **8 file migrasi SQL** di `supabase/migrations/`. Semua bersifat **non-destruktif** (`create table if not exists`, `drop ... if exists` sebelum create policy/trigger, tanpa `drop table`).

## Menjalankan migrasi

### Opsi A — SQL Editor (paling mudah)

1. Buka **Supabase Dashboard → SQL Editor**.
2. Jalankan setiap file **berurutan menurut nama** (prefix timestamp menjamin urutan) — **jangan loncat**, terutama `000007` wajib setelah `000002`–`000006` (lihat catatan di bawah):
   - `20261024000001_profiles_roles.sql`
   - `20261024000002_content.sql`
   - `20261024000003_media.sql`
   - `20261024000004_community.sql`
   - `20261024000005_requests.sql`
   - `20261024000006_admin.sql`
   - `20261024000007_rls.sql`
   - `20261024000008_search.sql`
   - `20261024000009_request_attachments.sql`
3. Bila ada error di file tertentu, perbaiki lalu jalankan ulang file itu saja (semua idempoten).

> ⚠️ **000007 harus setelah 000002–000006.** File RLS mengaktifkan `enable row level
> security` di semua tabel lebih dulu; bila tabel dari 000002–000006 belum ada, script
> berhenti di tengah dan `profiles`/`member_roles` berakhir RLS-nyala-tanpa-policy
> (aplikasi melihat data kosong). Jika ini terjadi: selesaikan 000002–000006, lalu
> **jalankan ulang seluruh file 000007** (idempoten), lanjut 000008 & 000009.
>
> ⚠️ **000009 harus setelah 000005** (menambah kolom lampiran pada `content_requests`
> dan bucket Storage `request-files`).

### Opsi B — Supabase CLI

```bash
supabase link --project-ref <REF-ANDA>
supabase db push
```

CLI menjalankan seluruh folder `supabase/migrations/`.

---

## Ikhtisar skema

### 000001 — Profil & peran
- **`profiles`** — identitas publik (`display_name`, `avatar_url`, `bio`). **Email TIDAK disimpan di sini** (hanya di `auth.users`).
- **`member_roles`** — peran anggota (`primary_admin` | `content_admin` | `staff`). Unique `(user_id, role)`.
- Trigger `handle_new_user` membuat baris `profiles` otomatis saat user OAuth baru terdaftar.
- Helper SQL: `has_role()`, `is_staff()`, `is_content_admin()`, `is_primary_admin()`.

### 000002 — Konten inti
- **`games`** — katalog game (`slug`, `title`, `genre`, `status`).
- **`files`** — file unduhan (`category`, `size_bytes`, `check_status`, `security_notes`, `screenshots jsonb`).
- **`file_versions`** — riwayat versi (`version_label`, `sha256`, `is_latest`). **Partial unique index** memastikan hanya satu `is_latest` per file.
- **`download_hosts`** — host alternatif (`name`, `url`, `priority`, `status`). URL asli **tersembunyi dari publik** (lihat RLS).
- **`download_events`** — pencatatan **klik** (bukan klaim unduhan sukses).

### 000003 — Media
- **`tutorials`** — tutorial (Markdown, `body text`).
- **`videos`** — video YouTube (`video_url`, `thumbnail_url`, `duration_seconds`). Tanpa sinkronisasi API — dikelola manual.
- **`featured_items`** — penempatan konten unggulan per section (`game_id`/`file_id`/`tutorial_id`/`video_id`, tepat satu terisi).

### 000004 — Komunitas
- **`forum_topics`** — topik (`hidden`, `locked`, `hotness_score`, `comment_count`).
- **`forum_comments`** — komentar (`parent_id` untuk berjenjang, `hidden`).
- **`forum_reactions`** — 5 emoji. Unique `(user_id, comment_id, reaction)` → **satu reaksi per user per komentar**.
- **`content_reports`** — laporan (`topic_id` XOR `comment_id`). Unique partial index mencegah laporan ganda terbuka.

### 000005 — Permintaan konten
- **`content_requests`** — permintaan (`request_type`, `status` 5 nilai, `vote_count`, `admin_notes`, `result_file_id`).
- **`request_votes`** — **composite PK `(request_id, user_id)`** → **satu suara per user per permintaan, dicegah di level DB**.
- Trigger `sync_vote_count` memelihara `vote_count` (INSERT/DELETE).

### 000006 — Admin
- **`audit_logs`** — append-only. **Tidak ada policy INSERT untuk client** → hanya service-role (server) yang dapat menulis; log tidak dapat dipalsukan anggota.
- **`site_settings`** — nilai jsonb non-secret. API menolak key/value yang mengandung pola rahasia.

### 000007 — RLS
Mengaktifkan Row Level Security di **seluruh tabel** + mendefinisikan policy:
- Konten `published` terbaca publik; seluruh status terbaca `content_admin`.
- Insert/update/delete konten hanya `content_admin` (dengan `created_by = auth.uid()`).
- **`download_hosts`: policy SELECT publik TIDAK memilih kolom `url`** → URL asli tidak pernah bocor ke klien anonim. Hanya server (service role) yang membaca `url` untuk redirect.
- `member_roles` & `site_settings`: tulis hanya `primary_admin`.

### 000008 — Pencarian
- Kolom `search_vector` (tsvector) + trigger update otomatis untuk `games`, `files`, `tutorials`, `videos`, `forum_topics`.
- Index GIN + trigram (`pg_trgm`) untuk pencocokan parsial.
- Fungsi SQL **`global_search(query, ...)`** mengembalikan hasil dikelompokkan per tipe, dengan rank & hitungan total.
- Bila fungsi ini tidak ada (mis. migrasi belum dijalankan), lapisan data di `src/lib/data/search.ts` **otomatis jatuh ke fallback `ilike`** — pencarian tetap berfungsi tanpa RPC.

### 000009 — Lampiran permintaan
- Kolom baru `content_requests`: `script_text` (teks/script tempel, ≤ 20.000 karakter), `screenshots` (jsonb[], ≤ 6 URL), `attachments` (jsonb[], ≤ 5 file `{name, url, size, type}`).
- Bucket Storage **`request-files`** (publik-baca, batas 5 MB/file): upload hanya ke folder `user_id/` sendiri; hapus oleh pemilik atau admin — semua lewat policy `storage.objects`.
- Validasi rinci (tipe/jumlah/ukuran/lokasi URL) dilakukan di API (`src/app/api/requests/route.ts`, Zod) sebelum insert.

---

## Catatan penting

- **Tidak ada migrasi destruktif.** Menjalankan ulang aman (idempoten).
- **Tidak ada data dummy.** Tabel kosong sampai admin menambah konten lewat dashboard. Halaman menampilkan empty state yang jujur.
- **Email tidak pernah** disimpan di tabel publik atau dikirim ke frontend.
- Semua timestamp tipe `timestamptz`.

## Verifikasi RLS aktif

```sql
-- Harus mengembalikan baris untuk SEMUA tabel publik
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

-- Cek tabel yang RLS-nya belum aktif (harus kosong)
select relname from pg_class
where relkind = 'r'
  and relnamespace = 'public'::regnamespace
  and not relrowsecurity;
```

Query kedua harus mengembalikan **0 baris**.
