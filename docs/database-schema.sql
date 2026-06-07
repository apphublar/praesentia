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
