-- Migration: textos de convite gerados por IA
-- Run after 001-plan-flow.sql

alter table events add column if not exists invite_copy jsonb;
alter table events add column if not exists ai_text_generations_count int not null default 0;
alter table events add column if not exists ai_text_edits_count int not null default 0;
