-- Migration: orientações para equipe de check-in
-- Run after 011-mural-guest-access.sql

alter table events add column if not exists check_in_notes text;
