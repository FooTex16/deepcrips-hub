-- ============================================================================
-- DeepCrips Hub — Migrasi 000004
-- Komunitas: forum topics, comments, reactions (emoji), reports.
-- Counter dijaga trigger SECURITY DEFINER agar konsisten tanpa membocorkan
-- hak tulis ke anggota. Popularitas = reaksi*3 + komentar (deterministik).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- forum_topics
-- ---------------------------------------------------------------------------
create table if not exists public.forum_topics (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  body             text not null,
  author_id        uuid not null references public.profiles (id) on delete cascade,
  game_id          uuid references public.games (id) on delete set null,
  hidden           boolean not null default false,
  locked           boolean not null default false,
  reaction_count   int not null default 0,
  comment_count    int not null default 0,
  hotness_score    numeric not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint forum_topics_title_len check (char_length(title) between 3 and 160),
  constraint forum_topics_body_len check (char_length(body) between 1 and 20000)
);

drop trigger if exists forum_topics_set_updated_at on public.forum_topics;
create trigger forum_topics_set_updated_at before update on public.forum_topics
  for each row execute function public.set_updated_at();

create index if not exists forum_topics_created_idx on public.forum_topics (created_at desc);
create index if not exists forum_topics_hot_idx on public.forum_topics (hotness_score desc, last_activity_at desc);
create index if not exists forum_topics_activity_idx on public.forum_topics (last_activity_at desc);
create index if not exists forum_topics_game_idx on public.forum_topics (game_id);

-- ---------------------------------------------------------------------------
-- forum_comments (satu tingkat balasan via parent_id)
-- ---------------------------------------------------------------------------
create table if not exists public.forum_comments (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid not null references public.forum_topics (id) on delete cascade,
  author_id      uuid not null references public.profiles (id) on delete cascade,
  parent_id      uuid references public.forum_comments (id) on delete cascade,
  body           text not null,
  hidden         boolean not null default false,
  reaction_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint forum_comments_body_len check (char_length(body) between 1 and 10000)
);

drop trigger if exists forum_comments_set_updated_at on public.forum_comments;
create trigger forum_comments_set_updated_at before update on public.forum_comments
  for each row execute function public.set_updated_at();

create index if not exists forum_comments_topic_created_idx on public.forum_comments (topic_id, created_at);
create index if not exists forum_comments_author_idx on public.forum_comments (author_id);

-- ---------------------------------------------------------------------------
-- forum_reactions: 👍 ❤️ 😂 🔥 👀 — maksimal satu reaksi per user per emoji
-- per target (unique partial index = Anti-Spam & anti-duplikasi di DB).
-- ---------------------------------------------------------------------------
create table if not exists public.forum_reactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  topic_id   uuid references public.forum_topics (id) on delete cascade,
  comment_id uuid references public.forum_comments (id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  constraint forum_reactions_one_target check (
    (case when topic_id is not null then 1 else 0 end)
    + (case when comment_id is not null then 1 else 0 end) = 1
  ),
  constraint forum_reactions_emoji_allowed check (emoji in ('👍', '❤️', '😂', '🔥', '👀'))
);

create unique index if not exists forum_reactions_user_topic_emoji_uq
  on public.forum_reactions (user_id, topic_id, emoji) where topic_id is not null;
create unique index if not exists forum_reactions_user_comment_emoji_uq
  on public.forum_reactions (user_id, comment_id, emoji) where comment_id is not null;

-- ---------------------------------------------------------------------------
-- content_reports: laporan topik/komentar (maks 1 laporan terbuka per user
-- per target, dicegah unique partial index).
-- ---------------------------------------------------------------------------
create table if not exists public.content_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  topic_id    uuid references public.forum_topics (id) on delete cascade,
  comment_id  uuid references public.forum_comments (id) on delete cascade,
  reason      text not null,
  details     text,
  status      public.report_status not null default 'open',
  handled_by  uuid references public.profiles (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint content_reports_one_target check (
    (case when topic_id is not null then 1 else 0 end)
    + (case when comment_id is not null then 1 else 0 end) = 1
  ),
  constraint content_reports_reason_len check (char_length(reason) between 1 and 60),
  constraint content_reports_details_len check (details is null or char_length(details) <= 2000)
);

create unique index if not exists content_reports_one_open_topic_uq
  on public.content_reports (reporter_id, topic_id) where topic_id is not null and status = 'open';
create unique index if not exists content_reports_one_open_comment_uq
  on public.content_reports (reporter_id, comment_id) where comment_id is not null and status = 'open';
create index if not exists content_reports_status_created_idx on public.content_reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Util perhitungan statistik (SECURITY DEFINER agar trigger tidak terblokir
-- RLS saat menghitung ulang dari konteks user biasa).
-- ---------------------------------------------------------------------------
create or replace function public.refresh_topic_stats(p_topic_id uuid)
returns void
language sql security definer
set search_path = public
as $$
  update public.forum_topics t
  set reaction_count = (select count(*) from public.forum_reactions r where r.topic_id = t.id),
      comment_count  = (select count(*) from public.forum_comments c where c.topic_id = t.id and not c.hidden),
      hotness_score  = (select count(*) from public.forum_reactions r where r.topic_id = t.id) * 3
                       + (select count(*) from public.forum_comments c where c.topic_id = t.id and not c.hidden),
      last_activity_at = greatest(
        t.created_at,
        coalesce((select max(c.created_at) from public.forum_comments c where c.topic_id = t.id), t.created_at)
      )
  where t.id = p_topic_id;
$$;

create or replace function public.forum_stats_trigger_fn()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  tid := coalesce(new.topic_id, old.topic_id);
  if tid is not null then
    perform public.refresh_topic_stats(tid);
  end if;
  -- komentar juga memperbarui statistik topik induknya
  if tg_table_name = 'forum_comments' and coalesce(new.parent_id, old.parent_id) is not null then
    null; -- parent berada di topik yang sama, sudah tertangani oleh topic_id
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists forum_reactions_stats on public.forum_reactions;
create trigger forum_reactions_stats
  after insert or delete on public.forum_reactions
  for each row execute function public.forum_stats_trigger_fn();

drop trigger if exists forum_comments_stats on public.forum_comments;
create trigger forum_comments_stats
  after insert or delete on public.forum_comments
  for each row execute function public.forum_stats_trigger_fn();

-- ---------------------------------------------------------------------------
-- Pelindung kolom moderasi: hanya staff yang boleh mengubah hidden/locked
-- dan kolom counter (mencegah anggota meng-unhide konten yang disembunyikan
-- moderator atau memanipulasi skor popularitas).
-- ---------------------------------------------------------------------------
create or replace function public.protect_forum_moderation_fields()
returns trigger
language plpgsql
as $$
begin
  if not public.is_staff() then
    if new.hidden is distinct from old.hidden
       or new.locked is distinct from old.locked
       or new.reaction_count is distinct from old.reaction_count
       or new.comment_count is distinct from old.comment_count
       or new.hotness_score is distinct from old.hotness_score then
      raise exception 'Hanya moderator yang dapat mengubah field moderasi';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists forum_topics_protect_fields on public.forum_topics;
create trigger forum_topics_protect_fields
  before update on public.forum_topics
  for each row execute function public.protect_forum_moderation_fields();

drop trigger if exists forum_comments_protect_fields on public.forum_comments;
create trigger forum_comments_protect_fields
  before update on public.forum_comments
  for each row execute function public.protect_forum_moderation_fields();
