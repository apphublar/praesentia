-- Migration: créditos extras de convite IA no plano gratuito (pacote R$ 4,90)
-- Run after 006-ai-cover-artifacts.sql

alter table events add column if not exists ai_cover_pack_bonus_generations int not null default 0;
alter table events add column if not exists ai_cover_pack_bonus_edits int not null default 0;
