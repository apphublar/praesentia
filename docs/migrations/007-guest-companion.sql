-- Migration: acompanhante na confirmação de presença
-- Run after 006-ai-cover-artifacts.sql

alter table guest_rsvps add column if not exists companion_name text;
