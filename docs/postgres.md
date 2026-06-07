# Postgres Persistence

The app now uses a repository factory:

- Without `DATABASE_URL`, it uses the in-memory repository for local prototyping.
- With `DATABASE_URL`, it uses the Postgres repository in `src/lib/db/postgres.ts`.

## Setup

1. Create a Supabase project.
2. Run `docs/database-schema.sql` in the Supabase SQL editor.
3. Set `DATABASE_URL` in `.env.local` or Vercel.
4. Set the Supabase Auth variables in `.env.local` or Vercel.
5. Restart the dev server.

The production schema links `public.users.id` to `auth.users.id`. A trigger creates the public profile automatically after signup.

After creating the first admin account through Supabase Auth, promote it manually:

```sql
update public.users
set role = 'platform_admin'
where email = 'your-admin-email@example.com';
```

Do not expose service role credentials in the browser.

## Current Repository Coverage

- Users.
- Events.
- Event members and RSVP.
- Pix settings.
- Media items.
- Likes.
- Owner controls: block/unblock guest, archive/delete/hide media.
- Audit logs.

## Notes

Pix keys are currently stored in the `key_encrypted` column but are not encrypted by the application layer yet. Before production, add envelope encryption or a managed secret/encryption service for sensitive fields.
