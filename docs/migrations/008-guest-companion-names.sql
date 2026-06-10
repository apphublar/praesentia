-- Migration: múltiplos acompanhantes por convite
-- Run after 007-guest-companion.sql

alter table guest_rsvps add column if not exists companion_names jsonb not null default '[]'::jsonb;

update guest_rsvps
set companion_names = jsonb_build_array(companion_name)
where companion_name is not null
  and btrim(companion_name) <> ''
  and companion_names = '[]'::jsonb;
