-- ============================================================================
-- DeepCrips Hub — Migrasi 000006
-- Audit log & site settings.
-- Audit log: TIDAK ADA kebijakan INSERT untuk client — hanya service-role
-- (server) yang dapat menulis, sehingga log tidak bisa dipalsukan anggota.
-- ============================================================================

create table if not exists public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  constraint audit_logs_action_len check (char_length(action) between 1 and 80),
  constraint audit_logs_entity_type_len check (char_length(entity_type) between 1 and 40),
  constraint audit_logs_metadata_size check (pg_column_size(metadata) < 8192)
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- site_settings: pengaturan situs non-secret (mis. link komunitas, teks
-- footer). Secret TIDAK boleh disimpan di sini.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  description text,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now(),
  constraint site_settings_key_len check (char_length(key) between 1 and 60)
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();
