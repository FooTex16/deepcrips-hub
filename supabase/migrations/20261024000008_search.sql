-- ============================================================================
-- DeepCrips Hub — Migrasi 000008
-- Pencarian: kolom tsvector (config 'simple' — ramah bahasa Indonesia),
-- indeks GIN + trigram untuk pencarian parsial, dan fungsi global_search
-- (hanya konten published) untuk halaman pencarian global.
-- ============================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Kolom pencarian (generated stored) + indeks GIN
-- ---------------------------------------------------------------------------
alter table public.games add column if not exists search_tsv tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(genre, '')), 'C')
) stored;

alter table public.files add column if not exists search_tsv tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'D')
) stored;

alter table public.tutorials add column if not exists search_tsv tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C')
) stored;

alter table public.videos add column if not exists search_tsv tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(category, '')), 'C')
) stored;

alter table public.forum_topics add column if not exists search_tsv tsvector generated always as (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(body, '')), 'B')
) stored;

create index if not exists games_search_idx   on public.games        using gin (search_tsv);
create index if not exists files_search_idx   on public.files        using gin (search_tsv);
create index if not exists tutorials_search_idx on public.tutorials  using gin (search_tsv);
create index if not exists videos_search_idx  on public.videos       using gin (search_tsv);
create index if not exists topics_search_idx  on public.forum_topics using gin (search_tsv);

-- Trigram untuk pencarian parsial (ILIKE '%kata%')
create index if not exists games_title_trgm_idx   on public.games        using gin (title extensions.gin_trgm_ops);
create index if not exists files_title_trgm_idx   on public.files        using gin (title extensions.gin_trgm_ops);
create index if not exists tutorials_title_trgm_idx on public.tutorials  using gin (title extensions.gin_trgm_ops);
create index if not exists videos_title_trgm_idx  on public.videos       using gin (title extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Fungsi pencarian global (security definer; hasil HANYA konten published).
-- ---------------------------------------------------------------------------
create or replace function public.global_search(
  p_query text,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  source   text,
  id       uuid,
  slug     text,
  title    text,
  subtitle text,
  url      text,
  rank     real
)
language sql stable security definer
set search_path = public
as $$
  with params as (
    select
      nullif(trim(p_query), '') as raw,
      least(greatest(coalesce(p_limit, 20), 1), 50) as lim,
      greatest(coalesce(p_offset, 0), 0) as off
  ),
  q as (
    select plainto_tsquery('simple', raw) as tsq, raw as likeq from params where raw is not null
  )
  select * FROM (
    select
      'game'::text as source, g.id, g.slug, g.title,
      coalesce(g.summary, '')::text as subtitle,
      '/games/' || g.slug as text,
      ts_rank(g.search_tsv, q.tsq) as rank
    from public.games g, q
    where g.status = 'published' and (g.search_tsv @@ q.tsq or g.title ilike '%' || q.likeq || '%')

    union all

    select
      'file'::text, f.id, f.slug, f.title,
      coalesce(f.summary, '')::text,
      '/downloads/' || f.slug,
      ts_rank(f.search_tsv, q.tsq)
    from public.files f, q
    where f.status = 'published' and (f.search_tsv @@ q.tsq or f.title ilike '%' || q.likeq || '%')

    union all

    select
      'tutorial'::text, t.id, t.slug, t.title,
      coalesce(t.summary, '')::text,
      '/tutorials/' || t.slug,
      ts_rank(t.search_tsv, q.tsq)
    from public.tutorials t, q
    where t.status = 'published' and (t.search_tsv @@ q.tsq or t.title ilike '%' || q.likeq || '%')

    union all

    select
      'video'::text, v.id, v.slug, v.title,
      coalesce(v.description, '')::text,
      '/videos?v=' || v.slug,
      ts_rank(v.search_tsv, q.tsq)
    from public.videos v, q
    where v.status = 'published' and (v.search_tsv @@ q.tsq or v.title ilike '%' || q.likeq || '%')
  ) results
  order by rank desc
  limit (select lim from params)
  offset (select off from params);
$$;
