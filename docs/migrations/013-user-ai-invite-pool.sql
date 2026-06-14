-- Migration: pool de versões de convite IA por conta (planos Inspiração / Criativo)
-- Run after 009-ai-cover-pack.sql

alter table users add column if not exists ai_invite_free_used boolean not null default false;
alter table users add column if not exists ai_invite_pool_remaining int not null default 0;
alter table users add column if not exists ai_invite_pool_plan text;
