-- ============================================================================
-- DeepCrips Hub — Migrasi 000003
-- Media: tutorials, videos (dikelola manual, tanpa YouTube API), featured_items.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- tutorials
-- ---------------------------------------------------------------------------
create table if not exists public.tutorials (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  summary       text,
  body          text not null default '',
  category      text not null default 'general',
  game_id       uuid references public.games (id) on delete set null,
  cover_url     text,
  status        public.content_status not null default 'draft',
  published_at  timestamptz,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint tutorials_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint tutorials_title_len check (char_length(title) between 1 and 160),
  constraint tutorials_summary_len check (summary is null or char_length(summary) <= 400),
  constraint tutorials_body_len check (char_length(body) <= 100000),
  constraint tutorials_category_len check (char_length(category) between 1 and 40),
  constraint tutorials_cover_shape check (cover_url is null or cover_url ~* '^https?://')
);

drop trigger if exists tutorials_set_updated_at on public.tutorials;
create trigger tutorials_set_updated_at before update on public.tutorials
  for each row execute function public.set_updated_at();
drop trigger if exists tutorials_maintain_published_at on public.tutorials;
create trigger tutorials_maintain_published_at before insert or update on public.tutorials
  for each row execute function public.maintain_published_at();

create index if not exists tutorials_status_published_idx on public.tutorials (status, published_at desc);
create index if not exists tutorials_game_idx on public.tutorials (game_id);
create index if not exists tutorials_category_idx on public.tutorials (category);

-- ---------------------------------------------------------------------------
-- videos: dikelola manual oleh admin (tanpa sinkronisasi YouTube API).
-- ---------------------------------------------------------------------------
create table if not exists public.videos (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text,
  video_url        text not null,
  thumbnail_url    text,
  category         text not null default 'general',
  game_id          uuid references public.games (id) on delete set null,
  duration_seconds int,
  status           public.content_status not null default 'draft',
  published_at     timestamptz,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint videos_slug_shape check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint videos_title_len check (char_length(title) between 1 and 180),
  constraint videos_description_len check (description is null or char_length(description) <= 4000),
  constraint videos_url_shape check (video_url ~* '^https?://(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)'),
  constraint videos_thumbnail_shape check (thumbnail_url is null or thumbnail_url ~* '^https?://'),
  constraint videos_category_len check (char_length(category) between 1 and 40),
  constraint videos_duration_positive check (duration_seconds is null or duration_seconds >= 0)
);

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at before update on public.videos
  for each row execute function public.set_updated_at();
drop trigger if exists videos_maintain_published_at on public.videos;
create trigger videos_maintain_published_at before insert or update on public.videos
  for each row execute function public.maintain_published_at();

create index if not exists videos_status_published_idx on public.videos (status, published_at desc);
create index if not exists videos_game_idx on public.videos (game_id);
create index if not exists videos_category_idx on public.videos (category);

-- ---------------------------------------------------------------------------
-- featured_items: kontrol admin atas konten unggulan Home.
-- Tepat satu target per baris (CHECK), FK ke tiap entitas (integritas aman).
-- ---------------------------------------------------------------------------
create table if not exists public.featured_items (
  id          uuid primary key default gen_random_uuid(),
  section     text not null,
  game_id     uuid references public.games (id) on delete cascade,
  file_id     uuid references public.files (id) on delete cascade,
  tutorial_id uuid references public.tutorials (id) on delete cascade,
  video_id    uuid references public.videos (id) on delete cascade,
  position    int not null default 0,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint featured_items_one_target check (
    (case when game_id is not null then 1 else 0 end)
    + (case when file_id is not null then 1 else 0 end)
    + (case when tutorial_id is not null then 1 else 0 end)
    + (case when video_id is not null then 1 else 0 end) = 1
  ),
  constraint featured_items_section_len check (char_length(section) between 1 and 40)
);

create unique index if not exists featured_items_section_position_uq
  on public.featured_items (section, position);
create index if not exists featured_items_section_idx on public.featured_items (section, position);
