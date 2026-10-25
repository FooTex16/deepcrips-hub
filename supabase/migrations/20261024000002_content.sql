-- ============================================================================
-- DeepCrips Hub — Migrasi 000002
-- Konten inti: games, files, file_versions, download_hosts, download_events.
-- Relasi versi → host konsisten; riwayat versi tidak dihapus saat versi baru
-- terbit (hanya is_latest yang bergeser).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- games
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  summary       text,
  description   text,
  cover_url     text,
  genre         text,
  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint games_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint games_title_len check (char_length(title) between 1 and 120),
  constraint games_summary_len check (summary is null or char_length(summary) <= 400),
  constraint games_cover_shape check (cover_url is null or cover_url ~* '^https?://')
);

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at before update on public.games
  for each row execute function public.set_updated_at();
drop trigger if exists games_maintain_published_at on public.games;
create trigger games_maintain_published_at before insert or update on public.games
  for each row execute function public.maintain_published_at();

create index if not exists games_status_published_idx on public.games (status, published_at desc);

-- ---------------------------------------------------------------------------
-- files (metadata unduhan; file besar tetap di host eksternal)
-- ---------------------------------------------------------------------------

-- Helper untuk CHECK constraint: PostgreSQL melarang subquery langsung di
-- CHECK (error 0A000), jadi validasi "semua elemen text[] harus http(s)"
-- dibungkus fungsi SQL immutable (dipanggil dari constraint files di bawah).
create or replace function public.all_http_urls(urls text[])
returns boolean
language sql
immutable
parallel safe
as $$
  select coalesce(array_length(urls, 1), 0) = 0
      or not exists (
           select 1 from unnest(urls) as u where u !~* '^https?://'
         )
$$;

create table if not exists public.files (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  game_id        uuid references public.games (id) on delete set null,
  title          text not null,
  summary        text,
  description    text,
  category       text not null default 'other',
  size_bytes     bigint,
  source_info    text,
  security_notes text,
  check_status   public.check_status not null default 'unverified',
  check_notes    text,
  screenshots    text[] not null default '{}',
  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint files_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint files_title_len check (char_length(title) between 1 and 160),
  constraint files_summary_len check (summary is null or char_length(summary) <= 400),
  constraint files_description_len check (description is null or char_length(description) <= 20000),
  constraint files_category_len check (char_length(category) between 1 and 40),
  constraint files_size_positive check (size_bytes is null or size_bytes >= 0),
  constraint files_source_len check (source_info is null or char_length(source_info) <= 1000),
  constraint files_security_notes_len check (security_notes is null or char_length(security_notes) <= 4000),
  constraint files_check_notes_len check (check_notes is null or char_length(check_notes) <= 2000),
  constraint files_screenshots_http check (public.all_http_urls(screenshots))
);

drop trigger if exists files_set_updated_at on public.files;
create trigger files_set_updated_at before update on public.files
  for each row execute function public.set_updated_at();
drop trigger if exists files_maintain_published_at on public.files;
create trigger files_maintain_published_at before insert or update on public.files
  for each row execute function public.maintain_published_at();

create index if not exists files_status_published_idx on public.files (status, published_at desc);
create index if not exists files_game_idx on public.files (game_id);
create index if not exists files_category_idx on public.files (category);

-- ---------------------------------------------------------------------------
-- file_versions: riwayat versi lengkap.
-- is_latest hanya boleh satu per file (unique partial index).
-- Versi lama TIDAK dihapus saat versi baru diterbitkan.
-- ---------------------------------------------------------------------------
create table if not exists public.file_versions (
  id             uuid primary key default gen_random_uuid(),
  file_id        uuid not null references public.files (id) on delete cascade,
  version_label  text not null,
  release_notes  text,
  released_at    timestamptz,
  sha256         text,
  compatibility  text,
  status         public.version_status not null default 'available',
  is_latest      boolean not null default false,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint file_versions_label_unique_per_file unique (file_id, version_label),
  constraint file_versions_label_len check (char_length(version_label) between 1 and 40),
  constraint file_versions_notes_len check (release_notes is null or char_length(release_notes) <= 8000),
  constraint file_versions_sha256_shape check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  constraint file_versions_compatibility_len check (compatibility is null or char_length(compatibility) <= 500)
);

drop trigger if exists file_versions_set_updated_at on public.file_versions;
create trigger file_versions_set_updated_at before update on public.file_versions
  for each row execute function public.set_updated_at();

create unique index if not exists file_versions_one_latest_per_file
  on public.file_versions (file_id) where is_latest;
create index if not exists file_versions_file_released_idx on public.file_versions (file_id, released_at desc);

-- ---------------------------------------------------------------------------
-- download_hosts: beberapa host per versi, bisa diaktif/nonaktifkan admin.
-- Anggota TIDAK dapat mengubah URL (tidak ada kebijakan tulis untuk non-admin;
-- URL juga tidak diekspos ke kolom publik — lihat migrasi RLS + view publik).
-- ---------------------------------------------------------------------------
create table if not exists public.download_hosts (
  id              uuid primary key default gen_random_uuid(),
  file_version_id uuid not null references public.file_versions (id) on delete cascade,
  name            text not null,
  url             text not null,
  is_active       boolean not null default true,
  status          public.host_status not null default 'active',
  priority        int not null default 100,
  status_note     text,
  last_checked_at timestamptz,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint download_hosts_url_shape check (url ~* '^https?://'),
  constraint download_hosts_name_len check (char_length(name) between 1 and 60),
  constraint download_hosts_note_len check (status_note is null or char_length(status_note) <= 500),
  constraint download_hosts_priority_range check (priority between 0 and 1000)
);

drop trigger if exists download_hosts_set_updated_at on public.download_hosts;
create trigger download_hosts_set_updated_at before update on public.download_hosts
  for each row execute function public.set_updated_at();

create index if not exists download_hosts_version_idx on public.download_hosts (file_version_id);
create index if not exists download_hosts_version_active_idx on public.download_hosts (file_version_id, priority)
  where is_active and status = 'active';

-- ---------------------------------------------------------------------------
-- download_events: pencatatan KLIK (bukan klaim unduhan selesai).
-- Tidak menyimpan IP/email — hanya user id (opsional) dan waktu.
-- Rate limiting dilakukan di layer aplikasi (route handler).
-- ---------------------------------------------------------------------------
create table if not exists public.download_events (
  id              bigint generated always as identity primary key,
  file_id         uuid not null references public.files (id) on delete cascade,
  file_version_id uuid not null references public.file_versions (id) on delete cascade,
  host_id         uuid not null references public.download_hosts (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists download_events_created_idx on public.download_events (created_at desc);
create index if not exists download_events_host_idx on public.download_events (host_id, created_at desc);
create index if not exists download_events_file_idx on public.download_events (file_id, created_at desc);
