# Supabase Auth Setup

This is the production authentication plan for Praesentia.

## What The App Will Use

- Supabase Auth for signup, login, email confirmation and password recovery.
- Supabase Postgres as the source of truth for user profiles and event data.
- `public.users.id` mirrors `auth.users.id`.
- Admin status lives in `public.users.role`.
- Praesentia issues its existing signed app session after a successful Supabase login or auth callback.
- Development login remains disabled unless `ALLOW_DEV_AUTH_BYPASS=true` outside production.

## Your Supabase Checklist

1. Create a production Supabase project.
2. Copy the project URL and anon key.
3. Copy the database connection string for server-side `DATABASE_URL`.
4. Run `docs/database-schema.sql` in the SQL editor, or apply the MCP migrations recorded in Supabase.
5. In Authentication settings, enable email authentication.
6. Enable email confirmation before public launch.
7. Configure Site URL:
   - `https://your-production-domain`
8. Configure redirect URLs:
   - `https://your-production-domain/auth/callback`
   - `https://your-production-domain/login`
   - Vercel preview URLs only if you want preview auth testing.
9. Create your first admin account through the normal signup flow.
10. Promote the admin account in SQL:

```sql
update public.users
set role = 'platform_admin'
where email = 'your-admin-email@example.com';
```

11. Enable MFA for admin accounts.
12. Keep the service role key server-only. Never expose it in client components.

## Vercel Variables

Set these in Vercel:

```txt
APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-production-domain
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...
ALLOW_DEV_AUTH_BYPASS=false
```

## Local Development

For real auth locally:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_ENV=development
ALLOW_DEV_AUTH_BYPASS=false
```

For temporary local prototype access only:

```txt
ALLOW_DEV_AUTH_BYPASS=true
```

Never use the development bypass in Vercel production.
