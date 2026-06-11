-- Migration: organizador, endereço completo, RSVP vaquinha, presentes, RSVP ampliado, recados
-- Run after 009-ai-cover-pack.sql

alter table events add column if not exists organizer_name text;
alter table events add column if not exists venue_zip text;
alter table events add column if not exists venue_complement text;
alter table events add column if not exists rsvp_enabled boolean not null default true;
alter table events add column if not exists gift_suggestions jsonb not null default '[]'::jsonb;

alter table pix_settings add column if not exists min_per_person_cents int;

alter table guest_rsvps add column if not exists guest_email text;
alter table guest_rsvps add column if not exists guest_first_name text;
alter table guest_rsvps add column if not exists guest_last_name text;
alter table guest_rsvps add column if not exists rsvp_status text not null default 'confirmed';
alter table guest_rsvps add column if not exists pix_contributed_amount numeric;
alter table guest_rsvps add column if not exists terms_accepted_at timestamptz;
alter table guest_rsvps add column if not exists companions_detail jsonb not null default '[]'::jsonb;

create table if not exists guest_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) <= 500),
  visibility text not null check (visibility in ('public', 'private')),
  created_at timestamptz not null default now()
);

create index if not exists guest_messages_event_id_idx on guest_messages(event_id);
create index if not exists guest_messages_visibility_idx on guest_messages(event_id, visibility);
