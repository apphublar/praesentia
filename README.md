# Praesentia

Praesentia is a private-events platform for invitations, RSVP, optional Pix contributions, live event memories and 36-month digital capsules.

## Current Status

The original static prototype files are still in the project root as visual reference. The production-oriented app now starts in `src/` using Next.js App Router and TypeScript.

## Product Rules Implemented In The Foundation

- Events are private by default.
- Guests must have an account and confirmed RSVP to publish photos, videos or messages.
- There is no pre-moderation; owners can archive, delete, hide from screen or block guests.
- Blocking a guest archives that guest's content until the guest is unblocked.
- Likes are confidential: only the total count is shown.
- Free events use generated links such as `/evento/k8d2m9`.
- Paid events can later receive custom subdomains such as `festahoje.praesentia.com.br`.
- Media storage is designed around Cloudflare R2.

## Local Development

```bash
npm install
npm run dev
```

Useful routes:

- `/`
- `/evento/mavie-1-ano`
- `/evento/mavie-1-ano/telao`
- `/dashboard`
- `/dashboard/eventos/evt_mavie`
- `/admin`

Development session helpers:

- Set `ALLOW_DEV_AUTH_BYPASS=true` in local development only if you need the temporary development login.
- `POST /api/auth/dev-login` with `{ "email": "camila@example.com", "reauth": true }`
- `POST /api/auth/dev-login` with `{ "email": "admin@praesentia.com.br", "reauth": true }`
- `POST /api/auth/logout`

## Next Steps

1. Connect a real database.
2. Replace the development session stub with Supabase Auth.
3. Connect Cloudflare R2 credentials.
4. Choose the realtime provider for the live screen.
5. Add payments and plan enforcement.

Cloudflare storage details are documented in [docs/cloudflare-r2.md](docs/cloudflare-r2.md).
Postgres persistence details are documented in [docs/postgres.md](docs/postgres.md).
