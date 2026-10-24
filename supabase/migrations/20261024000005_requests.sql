-- ============================================================================
-- DeepCrips Hub — Migrasi 000005
-- Permintaan konten + suara dukungan.
-- Pencegahan suara ganda dilakukan di DATABASE (primary key komposit),
-- bukan hanya di UI.
-- ============================================================================

create table if not exists public.content_requests (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  request_type   text not null default 'file',
  game_id        uuid references public.games (id) on delete set null,
  description    text not null,
  requester_id   uuid not null references public.profiles (id) on delete cascade,
  status         public.request_status not null default 'pending',
  vote_count     int not null default 0,
  admin_notes    text,
  result_file_id uuid references public.files (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint content_requests_title_len check (char_length(title) between 3 and 160),
  constraint content_requests_description_len check (char_length(description) between 1 and 4000),
  constraint content_requests_type_allowed check (request_type in ('file', 'tutorial', 'video', 'game', 'other')),
  constraint content_requests_notes_len check (admin_notes is null or char_length(admin_notes) <= 2000)
);

drop trigger if exists content_requests_set_updated_at on public.content_requests;
create trigger content_requests_set_updated_at before update on public.content_requests
  for each row execute function public.set_updated_at();

create index if not exists content_requests_status_votes_idx on public.content_requests (status, vote_count desc);
create index if not exists content_requests_created_idx on public.content_requests (created_at desc);
create index if not exists content_requests_requester_idx on public.content_requests (requester_id);

-- ---------------------------------------------------------------------------
-- request_votes: PK komposit (request_id, user_id) ⇒ suara ganda MUSTAHIL
-- masuk ke database.
-- ---------------------------------------------------------------------------
create table if not exists public.request_votes (
  request_id uuid not null references public.content_requests (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create index if not exists request_votes_user_idx on public.request_votes (user_id);

-- ---------------------------------------------------------------------------
-- Penjaga status & kolom admin: pengusul tidak boleh mengubah status,
-- vote_count, atau catatan admin.
-- ---------------------------------------------------------------------------
create or replace function public.protect_request_admin_fields()
returns trigger
language plpgsql
as $$
begin
  if not public.is_staff() then
    if new.status is distinct from old.status
       or new.vote_count is distinct from old.vote_count
       or new.admin_notes is distinct from old.admin_notes
       or new.result_file_id is distinct from old.result_file_id
       or new.requester_id is distinct from old.requester_id then
      raise exception 'Hanya admin yang dapat mengubah field tersebut';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists content_requests_protect_fields on public.content_requests;
create trigger content_requests_protect_fields
  before update on public.content_requests
  for each row execute function public.protect_request_admin_fields();

-- ---------------------------------------------------------------------------
-- Penjaga integritas suara: hanya permintaan yang terlihat publik
-- (bukan 'pending') yang boleh didukung, dan hanya oleh user sendiri.
-- ---------------------------------------------------------------------------
create or replace function public.guard_request_vote()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.content_requests
    where id = new.request_id and status <> 'pending'
  ) then
    raise exception 'Hanya permintaan yang sudah ditinjau yang dapat didukung';
  end if;
  return new;
end;
$$;

drop trigger if exists request_votes_guard on public.request_votes;
create trigger request_votes_guard
  before insert on public.request_votes
  for each row execute function public.guard_request_vote();

-- ---------------------------------------------------------------------------
-- Update vote_count otomatis (SECURITY DEFINER agar tidak terblokir RLS).
-- ---------------------------------------------------------------------------
create or replace function public.refresh_request_vote_count()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  rid := coalesce(new.request_id, old.request_id);
  update public.content_requests
  set vote_count = (select count(*) from public.request_votes where request_id = rid)
  where id = rid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists request_votes_count on public.request_votes;
create trigger request_votes_count
  after insert or delete on public.request_votes
  for each row execute function public.refresh_request_vote_count();
