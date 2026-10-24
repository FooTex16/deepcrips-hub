# Deployment (Vercel + GitHub + Supabase)

DeepCrips Hub dirancang untuk **GitHub (kode) + Vercel (hosting/functions) + Supabase (data/auth)**. File besar disimpan di host eksternal (Drive/MediaFire/MEGA); database hanya menyimpan metadata + URL.

---

## 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: DeepCrips Hub"
git branch -M main
git remote add origin https://github.com/<ANDA>/deepcrips-hub.git
git push -u origin main
```

`.gitignore` sudah mengecualikan `.env.local`, `.env*`, `node_modules/`, `.next/`.

## 2. Impor ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new) → impor repo `deepcrips-hub`.
2. Framework preset terdeteksi otomatis: **Next.js**. Biarkan default.
3. **Environment Variables** — tambahkan semua variabel dari `.env.example` dengan nilai **produksi**:

   | Key | Value (produksi) |
   |-----|------------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<REF>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (**rahasia**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<domain-anda>` |
   | `NEXT_PUBLIC_YOUTUBE_HANDLE` | handle kanal (opsional) |

4. Klik **Deploy**.

## 3. OAuth redirect (produksi)

Di **Supabase → Authentication → URL Configuration**:
- **Site URL**: `https://<domain-anda>`
- **Redirect URLs**: tambahkan `https://<domain-anda>/auth/callback`

Di **Google Cloud → OAuth client**:
- Tambahkan redirect URI `https://<domain-anda>/auth/callback`

## 4. Domain kustom (opsional)

Vercel → *Project → Settings → Domains* → tambahkan domain, lalu ikuti instruksi DNS. Setelah domain aktif, perbarui `NEXT_PUBLIC_SITE_URL` dan seluruh redirect OAuth di atas.

## 5. Setelah deploy

- Login sekali memakai Google → beri diri Anda peran `primary_admin` (lihat [`SETUP.md` bagian 5](./SETUP.md#5-beri-diri-anda-peran-admin)).
- Buka `/admin` → mulai menambah konten.
- Pastikan semua migrasi sudah dijalankan (lihat [`DATABASE.md`](./DATABASE.md)).

---

## Catatan serverless Vercel

- **Rate limiting berbasis memori per-instance.** Di serverless, batas per-IP tidak konsisten antar-instance (lihat [`LIMITATIONS.md`](./LIMITATIONS.md)).
- Tidak ada filesystem persisten → semua state di Postgres.
- Route API bersifat **on-demand** (`ƒ` di hasil build) — tidak ada prerender statis untuk data privat.

## Health-check cepat

| URL | Perilaku tanpa Supabase | Perilaku dengan Supabase |
|-----|------------------------|--------------------------|
| `/` | render, empty state jujur | konten nyata |
| `/api/download/<hostId>` | `503` (service key kosong) | `302` redirect bila login & valid |
| `/sitemap.xml` | hanya rute statis | + halaman published |
| `/search` | empty / konfigurasi hilang | hasil dikelompokkan |
