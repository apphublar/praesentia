-- Migration: foto do homenageado para convite com IA
-- Run after 004-fundraising-format.sql

alter table events add column if not exists host_photo_url text;
