-- Pedidos de álbum de fotos impresso (Cápsula do Tempo)
-- Run after 017-venue-reference.sql

create table if not exists photo_album_orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  draft_json jsonb not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'paid', 'in_production', 'shipped')),
  page_count integer not null default 20,
  total_cents integer not null default 0,
  submitted_at timestamptz,
  paid_at timestamptz,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists photo_album_orders_event_id_key on photo_album_orders (event_id);
create index if not exists photo_album_orders_user_id_idx on photo_album_orders (user_id);
create index if not exists photo_album_orders_status_idx on photo_album_orders (status);
