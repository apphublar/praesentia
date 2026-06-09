-- Migration: shared storage pool (Plus), extra storage purchases

alter table events add column if not exists extra_storage_bytes bigint not null default 0;

alter table user_subscriptions add column if not exists extra_storage_bytes bigint not null default 0;

-- Plus events use the subscription pool; per-event limit stays at 0.
update events
set storage_limit_bytes = 0
where plan_tier = 'family' and storage_limit_bytes > 0;
