-- Migration: FKs para permitir exclusão de contas (admin ou auth cascade)
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
