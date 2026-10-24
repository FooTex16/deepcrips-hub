-- ============================================================================
-- DeepCrips Hub — Migrasi 000001
-- Extensions, enum, profiles, member_roles, dan helper otorisasi.
-- Bersifat additive & aman untuk database yang sudah ada (IF NOT EXISTS).
-- Belum dijalankan otomatis — jalankan via: supabase db push / SQL editor.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enum global
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.content_status as enum ('draft', 'in_review', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_role as enum ('primary_admin', 'content_admin', 'moderator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.request_status as enum ('pending', 'in_review', 'planned', 'completed', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.check_status as enum ('unverified', 'manual_review', 'hash_matched', 'reported_issue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.version_status as enum ('available', 'deprecated', 'unavailable');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.host_status as enum ('active', 'inactive', 'reported_broken');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Trigger util: updated_at otomatis
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger util: published_at terisi saat pertama kali berstatus published
-- ---------------------------------------------------------------------------
create or replace function public.maintain_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (old is null or old.status is distinct from 'published') and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: identitas publik anggota.
-- Email TIDAK disimpan di tabel ini (hanya di auth.users, tidak pernah
-- ditampilkan publik). Identitas utama = Supabase auth user id.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default 'Anggota',
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint profiles_display_name_len check (char_length(display_name) between 1 and 60),
  constraint profiles_bio_len check (bio is null or char_length(bio) <= 500),
  constraint profiles_avatar_shape check (avatar_url is null or avatar_url ~* '^https?://')
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- member_roles: satu user bisa memegang beberapa peran.
-- Ini SATU-SATUNYA sumber otorisasi admin (bukan metadata profil yang
-- bisa diubah anggota).
-- ---------------------------------------------------------------------------
create table if not exists public.member_roles (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role        public.member_role not null,
  granted_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  primary key (user_id, role)
);

create index if not exists member_roles_role_idx on public.member_roles (role);

-- ---------------------------------------------------------------------------
-- Fungsi otorisasi (security definer, dipakai di RLS & route handler server).
-- Parameter p_uid default auth.uid(): aman dipanggil dari RLS maupun server.
-- ---------------------------------------------------------------------------
create or replace function public.has_role(p_role public.member_role, p_uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.member_roles
    where user_id = p_uid and role = p_role
  );
$$;

create or replace function public.is_staff(p_uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.member_roles
    where user_id = p_uid
      and role in ('primary_admin', 'content_admin', 'moderator')
  );
$$;

-- Konten (game/file/versi/host/tutorial/video) hanya oleh content_admin/primary_admin.
create or replace function public.is_content_admin(p_uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.member_roles
    where user_id = p_uid
      and role in ('primary_admin', 'content_admin')
  );
$$;

create or replace function public.is_primary_admin(p_uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.has_role('primary_admin', p_uid);
$$;

-- ---------------------------------------------------------------------------
-- Auto-buat profil saat user baru mendaftar (OAuth).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
      'Anggota'
    ),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
