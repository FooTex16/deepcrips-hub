-- ============================================================================
-- DeepCrips Hub — Migrasi 000009
-- Lampiran permintaan konten: script/teks, beberapa screenshot, dan file.
-- Menambah kolom pada content_requests + bucket Storage "request-files"
-- beserta policy tulis/baca-nya.
--
-- PRASYARAT: jalankan SETELAH 000002 (tabel content_requests & games).
-- Urutan yang benar: 000001 → 000002 → 000003 → 000004 → 000005 → 000006
--                     → 000007 → 000008 → 000009
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Kolom baru pada content_requests
-- ---------------------------------------------------------------------------
alter table public.content_requests
  add column if not exists script_text text,
  add column if not exists screenshots  jsonb not null default '[]'::jsonb,
  add column if not exists attachments  jsonb not null default '[]'::jsonb;

alter table public.content_requests
  drop constraint if exists content_requests_script_len;
alter table public.content_requests
  add constraint content_requests_script_len
  check (script_text is null or char_length(script_text) <= 20000);

-- Guard bentuk dasar jsonb (validasi rinci: ukuran/tipe/jumlah ada di API Zod).
alter table public.content_requests
  drop constraint if exists content_requests_media_shape;
alter table public.content_requests
  add constraint content_requests_media_shape
  check (
    jsonb_typeof(screenshots) = 'array'
    and jsonb_typeof(attachments) = 'array'
    and jsonb_array_length(screenshots) <= 6
    and jsonb_array_length(attachments) <= 5
  );

-- ---------------------------------------------------------------------------
-- Bucket Storage: request-files (publik-baca, tulis hanya pemilik folder)
-- Batas 5 MB/file sesuai validasi client & API.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-files',
  'request-files',
  true,
  5242880,
  null
)
on conflict (id) do nothing;

-- Baca publik: gambar/screenshot tampil di halaman permintaan tanpa token.
drop policy if exists "request_files_public_read" on storage.objects;
create policy "request_files_public_read"
  on storage.objects for select
  using (bucket_id = 'request-files');

-- Upload hanya user login, hanya ke folder miliknya sendiri
-- (storage.foldername(name)[1] = UUID user).
drop policy if exists "request_files_owner_insert" on storage.objects;
create policy "request_files_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'request-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Hapus hanya pemilik folder atau admin (admin boleh bersihkan lampiran).
drop policy if exists "request_files_owner_delete" on storage.objects;
create policy "request_files_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'request-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );
