-- ============================================================================
-- DeepCrips Hub — Migrasi 000007
-- Row Level Security untuk SELURUH tabel + pembatasan grant kolom URL host.
-- Prinsip:
--   * Publik hanya membaca konten berstatus published.
--   * URL host download TIDAK pernah dibaca non-admin (login gate nyata).
--   * Tulis konten hanya content_admin/primary_admin.
--   * Moderasi hanya staff. Peran & settings hanya primary_admin.
--   * Audit log hanya ditulis service-role (tanpa policy INSERT).
-- ============================================================================

-- Aktifkan RLS di semua tabel
alter table public.profiles         enable row level security;
alter table public.member_roles     enable row level security;
alter table public.games            enable row level security;
alter table public.files            enable row level security;
alter table public.file_versions    enable row level security;
alter table public.download_hosts   enable row level security;
alter table public.download_events  enable row level security;
alter table public.tutorials        enable row level security;
alter table public.videos           enable row level security;
alter table public.featured_items   enable row level security;
alter table public.forum_topics     enable row level security;
alter table public.forum_comments   enable row level security;
alter table public.forum_reactions  enable row level security;
alter table public.content_reports  enable row level security;
alter table public.content_requests enable row level security;
alter table public.request_votes    enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.site_settings    enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read" on public.profiles
  for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- Insert via trigger handle_new_user (security definer). Tidak ada delete policy.

-- ---------------------------------------------------------------------------
-- member_roles — baca publik (ID admin bukan rahasia), tulis primary_admin
-- ---------------------------------------------------------------------------
drop policy if exists "roles_public_read" on public.member_roles;
create policy "roles_public_read" on public.member_roles
  for select using (true);

drop policy if exists "roles_insert_primary" on public.member_roles;
create policy "roles_insert_primary" on public.member_roles
  for insert with check (public.is_primary_admin());

drop policy if exists "roles_delete_primary" on public.member_roles;
create policy "roles_delete_primary" on public.member_roles
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------
drop policy if exists "games_read" on public.games;
create policy "games_read" on public.games
  for select using (status = 'published' or public.is_staff());

drop policy if exists "games_insert" on public.games;
create policy "games_insert" on public.games
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "games_update" on public.games;
create policy "games_update" on public.games
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "games_delete" on public.games;
create policy "games_delete" on public.games
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- files
-- ---------------------------------------------------------------------------
drop policy if exists "files_read" on public.files;
create policy "files_read" on public.files
  for select using (status = 'published' or public.is_staff());

drop policy if exists "files_insert" on public.files;
create policy "files_insert" on public.files
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "files_update" on public.files;
create policy "files_update" on public.files
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "files_delete" on public.files;
create policy "files_delete" on public.files
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- file_versions — terbaca jika file induk published atau staff
-- ---------------------------------------------------------------------------
drop policy if exists "file_versions_read" on public.file_versions;
create policy "file_versions_read" on public.file_versions
  for select using (
    public.is_staff()
    or exists (select 1 from public.files f where f.id = file_id and f.status = 'published')
  );

drop policy if exists "file_versions_insert" on public.file_versions;
create policy "file_versions_insert" on public.file_versions
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "file_versions_update" on public.file_versions;
create policy "file_versions_update" on public.file_versions
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "file_versions_delete" on public.file_versions;
create policy "file_versions_delete" on public.file_versions
  for delete using (public.is_content_admin());

-- ---------------------------------------------------------------------------
-- download_hosts
-- Baris terbaca publik (NAMA & status saja — kolom url dicabut, lihat bawah).
-- ---------------------------------------------------------------------------
drop policy if exists "download_hosts_read" on public.download_hosts;
create policy "download_hosts_read" on public.download_hosts
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.file_versions v
      join public.files f on f.id = v.file_id
      where v.id = file_version_id and f.status = 'published'
    )
  );

drop policy if exists "download_hosts_insert" on public.download_hosts;
create policy "download_hosts_insert" on public.download_hosts
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "download_hosts_update" on public.download_hosts;
create policy "download_hosts_update" on public.download_hosts
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "download_hosts_delete" on public.download_hosts;
create policy "download_hosts_delete" on public.download_hosts
  for delete using (public.is_content_admin());

-- Cabut grant baca tabel penuh dari anon & authenticated; berikan kembali
-- kolom NON-url. URL host hanya dapat dibaca via server (service-role) pada
-- /api/download — inilah login gate yang nyata, bukan sekadar sembunyi tombol.
revoke all on table public.download_hosts from anon, authenticated;
grant select (id, file_version_id, name, is_active, status, priority, status_note, last_checked_at, created_at, updated_at)
  on table public.download_hosts to authenticated;

-- View publik untuk anon: metadata host milik konten published, tanpa URL.
drop view if exists public.download_hosts_public;
create view public.download_hosts_public as
  select h.id, h.file_version_id, h.name, h.is_active, h.status, h.priority,
         h.status_note, h.last_checked_at
  from public.download_hosts h
  join public.file_versions v on v.id = h.file_version_id
  join public.files f on f.id = v.file_id
  where f.status = 'published';
grant select on public.download_hosts_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- download_events — klik dicatat server-side; anggota hanya boleh menyisipkan
-- event miliknya sendiri (dipakai fallback). Baca hanya staff.
-- ---------------------------------------------------------------------------
drop policy if exists "download_events_insert" on public.download_events;
create policy "download_events_insert" on public.download_events
  for insert with check (auth.uid() is not null and (user_id = auth.uid() or user_id is null));

drop policy if exists "download_events_staff_read" on public.download_events;
create policy "download_events_staff_read" on public.download_events
  for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- tutorials
-- ---------------------------------------------------------------------------
drop policy if exists "tutorials_read" on public.tutorials;
create policy "tutorials_read" on public.tutorials
  for select using (status = 'published' or public.is_staff());

drop policy if exists "tutorials_insert" on public.tutorials;
create policy "tutorials_insert" on public.tutorials
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "tutorials_update" on public.tutorials;
create policy "tutorials_update" on public.tutorials
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "tutorials_delete" on public.tutorials;
create policy "tutorials_delete" on public.tutorials
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- videos
-- ---------------------------------------------------------------------------
drop policy if exists "videos_read" on public.videos;
create policy "videos_read" on public.videos
  for select using (status = 'published' or public.is_staff());

drop policy if exists "videos_insert" on public.videos;
create policy "videos_insert" on public.videos
  for insert with check (public.is_content_admin() and created_by = auth.uid());

drop policy if exists "videos_update" on public.videos;
create policy "videos_update" on public.videos
  for update using (public.is_content_admin()) with check (public.is_content_admin());

drop policy if exists "videos_delete" on public.videos;
create policy "videos_delete" on public.videos
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- featured_items
-- ---------------------------------------------------------------------------
drop policy if exists "featured_read" on public.featured_items;
create policy "featured_read" on public.featured_items
  for select using (
    public.is_staff()
    or (game_id is not null and exists (select 1 from public.games g where g.id = game_id and g.status = 'published'))
    or (file_id is not null and exists (select 1 from public.files f where f.id = file_id and f.status = 'published'))
    or (tutorial_id is not null and exists (select 1 from public.tutorials t where t.id = tutorial_id and t.status = 'published'))
    or (video_id is not null and exists (select 1 from public.videos v where v.id = video_id and v.status = 'published'))
  );

drop policy if exists "featured_write" on public.featured_items;
create policy "featured_write" on public.featured_items
  for all using (public.is_content_admin()) with check (public.is_content_admin());

-- ---------------------------------------------------------------------------
-- forum_topics
-- ---------------------------------------------------------------------------
drop policy if exists "topics_read" on public.forum_topics;
create policy "topics_read" on public.forum_topics
  for select using (not hidden or public.is_staff());

drop policy if exists "topics_insert" on public.forum_topics;
create policy "topics_insert" on public.forum_topics
  for insert with check (auth.uid() is not null and author_id = auth.uid() and hidden = false);

drop policy if exists "topics_update" on public.forum_topics;
create policy "topics_update" on public.forum_topics
  for update using (auth.uid() = author_id or public.is_staff())
  with check (auth.uid() = author_id or public.is_staff());

drop policy if exists "topics_delete" on public.forum_topics;
create policy "topics_delete" on public.forum_topics
  for delete using (public.is_staff());

-- ---------------------------------------------------------------------------
-- forum_comments
-- ---------------------------------------------------------------------------
drop policy if exists "comments_read" on public.forum_comments;
create policy "comments_read" on public.forum_comments
  for select using (not hidden or public.is_staff());

drop policy if exists "comments_insert" on public.forum_comments;
create policy "comments_insert" on public.forum_comments
  for insert with check (
    auth.uid() is not null
    and author_id = auth.uid()
    and hidden = false
    and exists (select 1 from public.forum_topics t where t.id = topic_id and not t.hidden and not t.locked)
  );

drop policy if exists "comments_update" on public.forum_comments;
create policy "comments_update" on public.forum_comments
  for update using (auth.uid() = author_id or public.is_staff())
  with check (auth.uid() = author_id or public.is_staff());

drop policy if exists "comments_delete" on public.forum_comments;
create policy "comments_delete" on public.forum_comments
  for delete using (auth.uid() = author_id or public.is_staff());

-- ---------------------------------------------------------------------------
-- forum_reactions
-- ---------------------------------------------------------------------------
drop policy if exists "reactions_read" on public.forum_reactions;
create policy "reactions_read" on public.forum_reactions
  for select using (true);

drop policy if exists "reactions_insert" on public.forum_reactions;
create policy "reactions_insert" on public.forum_reactions
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and (
      (topic_id is not null and exists (select 1 from public.forum_topics t where t.id = topic_id and not t.hidden))
      or (comment_id is not null and exists (
        select 1 from public.forum_comments c
        join public.forum_topics t on t.id = c.topic_id
        where c.id = comment_id and not c.hidden and not t.hidden
      ))
    )
  );

drop policy if exists "reactions_delete" on public.forum_reactions;
create policy "reactions_delete" on public.forum_reactions
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- content_reports
-- ---------------------------------------------------------------------------
drop policy if exists "reports_insert" on public.content_reports;
create policy "reports_insert" on public.content_reports
  for insert with check (auth.uid() is not null and reporter_id = auth.uid());

drop policy if exists "reports_read" on public.content_reports;
create policy "reports_read" on public.content_reports
  for select using (auth.uid() = reporter_id or public.is_staff());

drop policy if exists "reports_update" on public.content_reports;
create policy "reports_update" on public.content_reports
  for update using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- content_requests — publik melihat yang sudah ditinjau; pengusul melihat
-- miliknya (termasuk pending).
-- ---------------------------------------------------------------------------
drop policy if exists "requests_read" on public.content_requests;
create policy "requests_read" on public.content_requests
  for select using (status <> 'pending' or auth.uid() = requester_id or public.is_staff());

drop policy if exists "requests_insert" on public.content_requests;
create policy "requests_insert" on public.content_requests
  for insert with check (
    auth.uid() is not null
    and requester_id = auth.uid()
    and status = 'pending'
    and vote_count = 0
  );

drop policy if exists "requests_update" on public.content_requests;
create policy "requests_update" on public.content_requests
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "requests_delete" on public.content_requests;
create policy "requests_delete" on public.content_requests
  for delete using (public.is_primary_admin());

-- ---------------------------------------------------------------------------
-- request_votes
-- ---------------------------------------------------------------------------
drop policy if exists "votes_read" on public.request_votes;
create policy "votes_read" on public.request_votes
  for select using (true);

drop policy if exists "votes_insert" on public.request_votes;
create policy "votes_insert" on public.request_votes
  for insert with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "votes_delete" on public.request_votes;
create policy "votes_delete" on public.request_votes
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- audit_logs — baca staff; TIDAK ADA policy insert untuk client.
-- ---------------------------------------------------------------------------
drop policy if exists "audit_read" on public.audit_logs;
create policy "audit_read" on public.audit_logs
  for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- site_settings — baca publik (non-secret), tulis primary_admin.
-- ---------------------------------------------------------------------------
drop policy if exists "settings_read" on public.site_settings;
create policy "settings_read" on public.site_settings
  for select using (true);

drop policy if exists "settings_write" on public.site_settings;
create policy "settings_write" on public.site_settings
  for insert with check (public.is_primary_admin());

drop policy if exists "settings_update" on public.site_settings;
create policy "settings_update" on public.site_settings
  for update using (public.is_primary_admin()) with check (public.is_primary_admin());

drop policy if exists "settings_delete" on public.site_settings;
create policy "settings_delete" on public.site_settings
  for delete using (public.is_primary_admin());
