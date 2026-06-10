-- Migration: artefatos auditáveis de geração de capa por IA
-- Run after 005-host-photo.sql

create table if not exists ai_cover_artifacts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  usage_type text not null check (usage_type in ('generation', 'edit')),
  prompt_version text not null,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'refunded')),
  request_summary jsonb not null default '{}'::jsonb,
  image_data_url text,
  artifact jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_cover_artifacts_event_id_idx on ai_cover_artifacts(event_id);
create index if not exists ai_cover_artifacts_status_idx on ai_cover_artifacts(status);
