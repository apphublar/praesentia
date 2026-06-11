-- Migration: prazo RSVP, mural por email/código, curtidas de convidado, legenda de foto
-- Run after 010-event-extras-rsvp-messages.sql

alter table events add column if not exists rsvp_deadline date;

alter table media_items add column if not exists guest_rsvp_id uuid references guest_rsvps(id) on delete set null;
alter table media_items add column if not exists caption text;
alter table media_items add column if not exists author_display_name text;

create table if not exists mural_access_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_rsvp_id uuid not null references guest_rsvps(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists mural_access_codes_event_email_idx on mural_access_codes(event_id, lower(email));

create table if not exists mural_access_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_first_name text not null,
  guest_last_name text not null,
  guest_email text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mural_access_requests_event_status_idx on mural_access_requests(event_id, status);

create table if not exists mural_guest_likes (
  event_id uuid not null references events(id) on delete cascade,
  media_id uuid not null references media_items(id) on delete cascade,
  guest_rsvp_id uuid not null references guest_rsvps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, media_id, guest_rsvp_id)
);
