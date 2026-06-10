-- Migration: plan flow (event format, capsule activation, AI quotas, check-in, subscriptions)
-- Run after base schema from database-schema.sql
--
-- Seguro para reexecutar no Supabase (idempotente).
-- Se o check-in acusar migração 001 desatualizada, rode este arquivo inteiro no SQL Editor.

-- ── Tipos enum ───────────────────────────────────────────────────────────────

do $$ begin
  create type event_format as enum ('in_person', 'online');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type cover_source as enum ('ai', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_status as enum ('active', 'past_due', 'canceled', 'trialing');
exception
  when duplicate_object then null;
end $$;

-- ── Colunas em events ────────────────────────────────────────────────────────

alter table events add column if not exists event_type text not null default 'outros';
alter table events add column if not exists host_name text not null default 'Responsavel';
alter table events add column if not exists cover_image_url text;
alter table events add column if not exists cover_source cover_source;
alter table events add column if not exists event_format event_format not null default 'in_person';
alter table events add column if not exists online_meeting_url text;
alter table events add column if not exists capsule_activated_at timestamptz;
alter table events add column if not exists ai_cover_generations_count int not null default 0;
alter table events add column if not exists ai_cover_edits_count int not null default 0;
alter table events add column if not exists ai_cover_pending_urls jsonb;

-- ── RSVP / check-in (guest_rsvps) ────────────────────────────────────────────

create table if not exists guest_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_name text not null,
  phone text,
  wants_capsule boolean not null default false,
  checked_in_at timestamptz,
  confirmed_at timestamptz not null default now()
);

-- Reparo: tabela criada parcialmente ou versão antiga sem check-in
alter table guest_rsvps add column if not exists phone text;
alter table guest_rsvps add column if not exists wants_capsule boolean not null default false;
alter table guest_rsvps add column if not exists checked_in_at timestamptz;
alter table guest_rsvps add column if not exists confirmed_at timestamptz not null default now();

create index if not exists idx_guest_rsvps_event on guest_rsvps(event_id);

-- ── Assinaturas family ───────────────────────────────────────────────────────

create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan_tier plan_tier not null default 'family',
  status subscription_status not null default 'active',
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  events_used_this_period int not null default 0,
  shared_storage_used_bytes bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_subscriptions_user on user_subscriptions(user_id);
