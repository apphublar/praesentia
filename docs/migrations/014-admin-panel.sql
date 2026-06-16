-- Admin panel: user moderation fields
alter table users add column if not exists blocked_at timestamptz;
alter table users add column if not exists admin_notes text;

create index if not exists users_blocked_at_idx on users (blocked_at) where blocked_at is not null;
create index if not exists audit_logs_action_created_idx on audit_logs (action, created_at desc);
create index if not exists ai_cover_artifacts_status_created_idx on ai_cover_artifacts (status, created_at desc);
