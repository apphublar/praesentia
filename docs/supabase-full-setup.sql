-- Praesentia Supabase full setup
-- Generated from docs/database-schema.sql and docs/migrations/*.sql
-- Run this once in a new Supabase project SQL Editor.


-- ============================================================
-- docs/database-schema.sql
-- ============================================================

create extension if not exists pgcrypto;

create type user_role as enum ('platform_admin', 'user');
create type event_visibility as enum ('private', 'public');
create type event_phase as enum ('before', 'live', 'memory');
create type plan_tier as enum ('free', 'capsule', 'family');
create type member_role as enum ('owner', 'manager', 'guest', 'viewer');
create type rsvp_status as enum ('pending', 'confirmed', 'declined');
create type access_status as enum ('active', 'blocked');
create type media_type as enum ('photo', 'video', 'message');
create type media_status as enum ('published', 'archived', 'deleted');

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.handle_new_auth_user() from authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id),
  slug text not null unique,
  free_code text unique,
  subdomain text unique,
  title text not null,
  theme text not null,
  description text,
  date date not null,
  starts_at text not null,
  ends_at text not null,
  venue_name text not null,
  venue_address text not null,
  city text not null,
  visibility event_visibility not null default 'private',
  phase event_phase not null default 'before',
  plan_tier plan_tier not null default 'free',
  storage_limit_bytes bigint not null,
  storage_used_bytes bigint not null default 0,
  retention_until timestamptz not null,
  public_terms_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role member_role not null default 'guest',
  rsvp_status rsvp_status not null default 'pending',
  access_status access_status not null default 'active',
  blocked_at timestamptz,
  blocked_by_user_id uuid references users(id),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table pix_settings (
  event_id uuid primary key references events(id) on delete cascade,
  enabled boolean not null default false,
  receiver_name text not null,
  key_encrypted text not null,
  suggested_amount_cents integer,
  message text,
  updated_at timestamptz not null default now()
);

create table screen_settings (
  event_id uuid primary key references events(id) on delete cascade,
  token_hash text not null,
  enabled boolean not null default false,
  paused boolean not null default false,
  show_qr_code boolean not null default true,
  show_videos boolean not null default true,
  show_messages boolean not null default true,
  layout text not null default 'recent_plus_top3',
  updated_at timestamptz not null default now()
);

create table media_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id),
  type media_type not null,
  status media_status not null default 'published',
  visible_on_screen boolean not null default true,
  r2_key text,
  url text,
  thumbnail_url text,
  text text,
  byte_size integer not null default 0,
  likes_count integer not null default 0,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table media_likes (
  event_id uuid not null references events(id) on delete cascade,
  media_id uuid not null references media_items(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, media_id, user_id)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  event_id uuid references events(id),
  action text not null,
  target_type text not null,
  target_id text,
  metadata jsonb not null default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index idx_event_members_user_id on event_members(user_id);
create index idx_media_items_event_status_created on media_items(event_id, status, created_at desc);
create index idx_media_items_event_likes on media_items(event_id, likes_count desc);
create index idx_audit_logs_event_created on audit_logs(event_id, created_at desc);

alter table users enable row level security;
alter table events enable row level security;
alter table event_members enable row level security;
alter table pix_settings enable row level security;
alter table screen_settings enable row level security;
alter table media_items enable row level security;
alter table media_likes enable row level security;
alter table audit_logs enable row level security;

create policy users_select_own_profile on users
  for select using (auth.uid() = id);

create policy events_select_membership on events
  for select using (
    visibility = 'public'
    or exists (
      select 1 from event_members
      where event_members.event_id = events.id
        and event_members.user_id = auth.uid()
        and event_members.access_status = 'active'
    )
  );

create policy event_members_select_own_or_manager on event_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from event_members manager
      where manager.event_id = event_members.event_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'manager')
        and manager.access_status = 'active'
    )
  );

create policy media_items_select_event_membership on media_items
  for select using (
    status = 'published'
    and exists (
      select 1 from events
      where events.id = media_items.event_id
        and (
          events.visibility = 'public'
          or exists (
            select 1 from event_members
            where event_members.event_id = media_items.event_id
              and event_members.user_id = auth.uid()
              and event_members.access_status = 'active'
          )
        )
    )
  );

create policy pix_settings_select_event_manager on pix_settings
  for select using (
    exists (
      select 1 from event_members manager
      where manager.event_id = pix_settings.event_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'manager')
        and manager.access_status = 'active'
    )
  );

create policy screen_settings_select_event_manager on screen_settings
  for select using (
    exists (
      select 1 from event_members manager
      where manager.event_id = screen_settings.event_id
        and manager.user_id = auth.uid()
        and manager.role in ('owner', 'manager')
        and manager.access_status = 'active'
    )
  );

create policy media_likes_select_event_membership on media_likes
  for select using (
    exists (
      select 1
      from media_items media
      join events event on event.id = media.event_id
      where media.id = media_likes.media_id
        and media.event_id = media_likes.event_id
        and media.status = 'published'
        and (
          event.visibility = 'public'
          or exists (
            select 1 from event_members member
            where member.event_id = media_likes.event_id
              and member.user_id = auth.uid()
              and member.access_status = 'active'
          )
        )
    )
  );

create policy audit_logs_select_platform_admin on audit_logs
  for select using (
    exists (
      select 1 from users current_user_profile
      where current_user_profile.id = auth.uid()
        and current_user_profile.role = 'platform_admin'
    )
  );


-- ============================================================
-- .\docs\migrations\001-plan-flow.sql
-- ============================================================

-- Migration: plan flow (event format, capsule activation, AI quotas, check-in, subscriptions)
-- Run after base schema from database-schema.sql
--
-- Seguro para reexecutar no Supabase (idempotente).
-- Se o check-in acusar migraÃ§Ã£o 001 desatualizada, rode este arquivo inteiro no SQL Editor.

-- â”€â”€ Tipos enum â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ Colunas em events â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

-- â”€â”€ RSVP / check-in (guest_rsvps) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

create table if not exists guest_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  guest_name text not null,
  phone text,
  wants_capsule boolean not null default false,
  checked_in_at timestamptz,
  confirmed_at timestamptz not null default now()
);

-- Reparo: tabela criada parcialmente ou versÃ£o antiga sem check-in
alter table guest_rsvps add column if not exists phone text;
alter table guest_rsvps add column if not exists wants_capsule boolean not null default false;
alter table guest_rsvps add column if not exists checked_in_at timestamptz;
alter table guest_rsvps add column if not exists confirmed_at timestamptz not null default now();

create index if not exists idx_guest_rsvps_event on guest_rsvps(event_id);

-- â”€â”€ Assinaturas family â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


-- ============================================================
-- .\docs\migrations\002-invite-ai.sql
-- ============================================================

-- Migration: textos de convite gerados por IA
-- Run after 001-plan-flow.sql

alter table events add column if not exists invite_copy jsonb;
alter table events add column if not exists ai_text_generations_count int not null default 0;
alter table events add column if not exists ai_text_edits_count int not null default 0;


-- ============================================================
-- .\docs\migrations\003-storage-pool.sql
-- ============================================================

-- Migration: shared storage pool (Plus), extra storage purchases

alter table events add column if not exists extra_storage_bytes bigint not null default 0;

alter table user_subscriptions add column if not exists extra_storage_bytes bigint not null default 0;

-- Plus events use the subscription pool; per-event limit stays at 0.
update events
set storage_limit_bytes = 0
where plan_tier = 'family' and storage_limit_bytes > 0;


-- ============================================================
-- .\docs\migrations\004-fundraising-format.sql
-- ============================================================

-- Migration: vaquinha / fundraising event format
-- Run after 001-plan-flow.sql

alter type event_format add value if not exists 'fundraising';


-- ============================================================
-- .\docs\migrations\005-host-photo.sql
-- ============================================================

-- Migration: foto do homenageado para convite com IA
-- Run after 004-fundraising-format.sql

alter table events add column if not exists host_photo_url text;


-- ============================================================
-- .\docs\migrations\006-ai-cover-artifacts.sql
-- ============================================================

-- Migration: artefatos auditÃ¡veis de geraÃ§Ã£o de capa por IA
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


-- ============================================================
-- .\docs\migrations\007-guest-companion.sql
-- ============================================================

-- Migration: acompanhante na confirmaÃ§Ã£o de presenÃ§a
-- Run after 006-ai-cover-artifacts.sql

alter table guest_rsvps add column if not exists companion_name text;


-- ============================================================
-- .\docs\migrations\008-guest-companion-names.sql
-- ============================================================

-- Migration: mÃºltiplos acompanhantes por convite
-- Run after 007-guest-companion.sql

alter table guest_rsvps add column if not exists companion_names jsonb not null default '[]'::jsonb;

update guest_rsvps
set companion_names = jsonb_build_array(companion_name)
where companion_name is not null
  and btrim(companion_name) <> ''
  and companion_names = '[]'::jsonb;


-- ============================================================
-- .\docs\migrations\009-ai-cover-pack.sql
-- ============================================================

-- Migration: crÃ©ditos extras de convite IA no plano gratuito (pacote R$ 4,90)
-- Run after 006-ai-cover-artifacts.sql

alter table events add column if not exists ai_cover_pack_bonus_generations int not null default 0;
alter table events add column if not exists ai_cover_pack_bonus_edits int not null default 0;


-- ============================================================
-- .\docs\migrations\010-event-extras-rsvp-messages.sql
-- ============================================================

-- Migration: organizador, endereÃ§o completo, RSVP vaquinha, presentes, RSVP ampliado, recados
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


-- ============================================================
-- .\docs\migrations\011-mural-guest-access.sql
-- ============================================================

-- Migration: prazo RSVP, mural por email/cÃ³digo, curtidas de convidado, legenda de foto
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


-- ============================================================
-- .\docs\migrations\012-check-in-notes.sql
-- ============================================================

-- Migration: orientaÃ§Ãµes para equipe de check-in
-- Run after 011-mural-guest-access.sql

alter table events add column if not exists check_in_notes text;


-- ============================================================
-- .\docs\migrations\013-user-ai-invite-pool.sql
-- ============================================================

-- Migration: pool de versÃµes de convite IA por conta (planos InspiraÃ§Ã£o / Criativo)
-- Run after 009-ai-cover-pack.sql

alter table users add column if not exists ai_invite_free_used boolean not null default false;
alter table users add column if not exists ai_invite_pool_remaining int not null default 0;
alter table users add column if not exists ai_invite_pool_plan text;


-- ============================================================
-- .\docs\migrations\014-admin-panel.sql
-- ============================================================

-- Admin panel: user moderation fields
alter table users add column if not exists blocked_at timestamptz;
alter table users add column if not exists admin_notes text;

create index if not exists users_blocked_at_idx on users (blocked_at) where blocked_at is not null;
create index if not exists audit_logs_action_created_idx on audit_logs (action, created_at desc);
create index if not exists ai_cover_artifacts_status_created_idx on ai_cover_artifacts (status, created_at desc);


-- ============================================================
-- .\docs\migrations\015-platform-admin-email.sql
-- ============================================================

-- Apenas adm.praesentia@gmail.com pode ser super admin
update public.users
set role = 'user', updated_at = now()
where role = 'platform_admin' and lower(email) <> 'adm.praesentia@gmail.com';

update public.users
set role = 'platform_admin', updated_at = now()
where lower(email) = 'adm.praesentia@gmail.com';

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role user_role := 'user';
begin
  if lower(new.email) = 'adm.praesentia@gmail.com' then
    assigned_role := 'platform_admin';
  end if;

  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    role = case
      when lower(excluded.email) = 'adm.praesentia@gmail.com' then 'platform_admin'::user_role
      when public.users.role = 'platform_admin' then 'user'::user_role
      else public.users.role
    end,
    updated_at = now();

  return new;
end;
$$;


-- ============================================================
-- .\docs\migrations\016-user-delete-cascade.sql
-- ============================================================

-- Migration: FKs para permitir exclusÃ£o de contas (admin ou auth cascade)
-- Run after 015-platform-admin-email.sql

alter table events drop constraint if exists events_owner_id_fkey;
alter table events
  add constraint events_owner_id_fkey
  foreign key (owner_id) references users(id) on delete cascade;

alter table media_items drop constraint if exists media_items_user_id_fkey;
alter table media_items
  add constraint media_items_user_id_fkey
  foreign key (user_id) references users(id) on delete cascade;

alter table audit_logs drop constraint if exists audit_logs_actor_user_id_fkey;
alter table audit_logs
  add constraint audit_logs_actor_user_id_fkey
  foreign key (actor_user_id) references users(id) on delete set null;

alter table audit_logs drop constraint if exists audit_logs_event_id_fkey;
alter table audit_logs
  add constraint audit_logs_event_id_fkey
  foreign key (event_id) references events(id) on delete set null;

alter table event_members drop constraint if exists event_members_blocked_by_user_id_fkey;
alter table event_members
  add constraint event_members_blocked_by_user_id_fkey
  foreign key (blocked_by_user_id) references users(id) on delete set null;


-- ============================================================
-- .\docs\migrations\017-venue-reference.sql
-- ============================================================

-- ReferÃªncia de local (ponto de encontro, referÃªncia visual) para eventos presenciais
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_reference text;


-- ============================================================
-- .\docs\migrations\018-photo-album-orders.sql
-- ============================================================

-- Pedidos de Ã¡lbum de fotos impresso (CÃ¡psula do Tempo)
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

