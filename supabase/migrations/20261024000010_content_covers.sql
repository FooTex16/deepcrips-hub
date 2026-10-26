-- ============================================================================
-- DeepCrips Hub — Migrasi 00010
-- Bucket Storage "content-covers" untuk cover/thumbnail konten yang diunggah
-- admin (game, tutorial, video). Publik-baca, tulis hanya content_admin+.
--
-- PRASYARAT: jalankan SETELAH 000009.
-- Urutan yang benar: 000001 → … → 000009 → 000010
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-covers',
  'content-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/x-icon', 'image/vnd.microsoft.icon']
)
on conflict (id) do nothing;

-- Baca publik: cover tampil di halaman katalog tanpa token.
drop policy if exists "content_covers_public_read" on storage.objects;
create policy "content_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'content-covers');

-- Upload hanya content_admin (termasuk primary_admin).
drop policy if exists "content_covers_staff_insert" on storage.objects;
create policy "content_covers_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'content-covers' and public.is_content_admin());

-- Ganti/hapus cover lama: hanya content_admin.
drop policy if exists "content_covers_staff_update" on storage.objects;
create policy "content_covers_staff_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'content-covers' and public.is_content_admin())
  with check (bucket_id = 'content-covers' and public.is_content_admin());

drop policy if exists "content_covers_staff_delete" on storage.objects;
create policy "content_covers_staff_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'content-covers' and public.is_content_admin());
