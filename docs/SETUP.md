# Setup DeepCrips Hub

Panduan langkah-demi-langkah untuk menjalankan DeepCrips Hub secara lokal dan menyiapkan layanan eksternal.

## Prasyarat

- **Node.js 20+** dan npm
- Akun **Supabase** (gratis mencukupi untuk mulai)
- Akun **Google Cloud** (untuk OAuth login)
- Akun **Vercel** (untai produksi) & **GitHub** (kode)

---

## 1. Instalasi & variabel lingkungan

```bash
npm install
cp .env.example .env.local
```

Buka `.env.local` lalu isi:

| Variabel | Nilai | Sumber |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<REF>.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | idem — **rahasia**, hanya server |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` (dev) / URL produksi | — |
| `NEXT_PUBLIC_YOUTUBE_HANDLE` | handle kanal (opsional) | — |

> **Penting:** `SUPABASE_SERVICE_ROLE_KEY` melewati RLS. Jangan sekali-kali meletakkannya di variabel `NEXT_PUBLIC_*` (ter-embed ke bundle browser). Tanpa kunci ini, endpoint download mengembalikan `503` secara jujur (bukan data palsu).

## 2. Buat proyek Supabase

1. Buka [supabase.com](https://supabase.com) → **New project**.
2. Catat **Project URL**, **anon key**, dan **service_role key** dari *Project Settings → API*.
3. Salin nilainya ke `.env.local` (lihat tabel di atas).

## 3. Jalankan migrasi database

Ikuti instruksi lengkap di [`DATABASE.md`](./DATABASE.md). Ringkasnya: buka *Supabase → SQL Editor*, lalu jalankan setiap file di `supabase/migrations/` **berurutan sesuai nomor** (000001 → 000009), **satu per satu dan jangan loncat**.

> ⚠️ **Penting — 000007 (RLS) wajib SETELAH 000002–000006.** File 000007 mengaktifkan RLS di semua tabel lalu membuat policy-nya. Jika dijalankan saat tabel 000002–000006 belum ada, script akan berhenti di tengah: RLS `profiles`/`member_roles` aktif **tanpa policy** → semua data profil & peran terlihat kosong untuk aplikasi (padahal ada di database). Bila ini sudah terjadi, jalankan ulang seluruh file `20261024000007_rls.sql` **setelah** 000002–000006 selesai — jalannya idempoten (`drop policy if exists`), aman diulang.

## 4. Konfigurasi Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → OAuth consent screen**. Set type ke *External* (atau Internal bila memakai Workspace), isi nama & logo.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Tambahkan redirect URI:
   - Development: `http://localhost:3000/auth/callback`
   - Produksi: `https://<domain-anda>/auth/callback`
4. Salin *Client ID* dan *Client Secret* ke Supabase: *Authentication → Providers → Google* → aktifkan, tempel ID & secret, **Save**.
5. Di *Authentication → URL Configuration*, set **Site URL** ke `NEXT_PUBLIC_SITE_URL` dan tambahkan `http://localhost:3000` ke *Redirect URLs* (dev).

## 5. Beri diri Anda peran admin

Peran disimpan di tabel `member_roles`. Setelah login pertama (Google) di situs, jalankan di SQL Editor (idempoten — aman dijalankan berulang):

```sql
-- Lihat daftar anggota
select id, display_name from public.profiles;

-- Beri peran admin utama berdasarkan email login Google
insert into public.member_roles (user_id, role, granted_by)
select u.id, 'primary_admin', u.id
from auth.users u
where u.email = 'luthfidomes2@gmail.com'  -- ganti dengan email Anda
on conflict (user_id, role) do nothing;

-- Verifikasi
select mr.role, p.display_name
from public.member_roles mr
join public.profiles p on p.id = mr.user_id;
```

> Catatan: baris `profiles` dibuat otomatis oleh trigger saat login pertama. Jika akun Anda login sebelum migrasi 000001 terpasang, buat dulu barisnya (ganti `<USER_UUID>` dengan id di tabel `auth.users`):
>
> ```sql
> insert into public.profiles (id, display_name)
> select id, coalesce(raw_user_meta_data ->> 'full_name', 'Anggota')
> from auth.users where email = 'luthfidomes2@gmail.com'
> on conflict (id) do nothing;
> ```

Tiga peran tersedia (urut kewenangan):

| Peran | Akses |
|-------|-------|
| `moderator` | Moderasi forum, tinjau laporan, lihat permintaan |
| `content_admin` | + Kelola game/file/versi/host/tutorial/video/unggulan |
| `primary_admin` | + Anggota & peran, pengaturan situs, hapus konten |

## 6. Jalankan

```bash
npm run dev        # http://localhost:3000
npm run build      # build produksi
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

> **Windows:** gunakan `npm.cmd` bila kebijakan eksekusi PowerShell memblokir `npm.ps1`.

---

## Catatan bila Supabase belum dikonfigurasi

Situs tetap dapat dibangun dan dijalankan. Halaman publik akan menampilkan keadaan **"konfigurasi belum lengkap"** yang jujur — bukan konten palsu. Fitur yang butuh data (katalog, forum, download) akan menampilkan empty state / `ConfigMissingState`.

## Langkah selanjutnya

- [`DATABASE.md`](./DATABASE.md) — detail skema, migrasi, RLS, fungsi pencarian.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) — deploy ke Vercel + produksi.
- [`LIMITATIONS.md`](./LIMITATIONS.md) — keterbatasan keamanan (jujur, tanpa klaim berlebihan).
