-- Migration: vaquinha / fundraising event format
-- Run after 001-plan-flow.sql

alter type event_format add value if not exists 'fundraising';
