# Implementation Roadmap

## Sprint 1 - Foundation

- Next.js App Router and TypeScript.
- Domain model for events, members, RSVP, media, Pix, screen and plans.
- Permission helpers.
- Security helpers.
- Initial routes for public site, event, dashboard, admin and live screen.

## Sprint 2 - Real Persistence

- Add database provider and migrations. Done as Postgres-ready SQL and repository factory.
- Implement users, events, event members, RSVP, media, likes and audit logs. Done for the initial repository coverage.
- Replace mock data. Ready once `DATABASE_URL` is configured.
- Add real authentication.

## Sprint 3 - Media

- Connect Cloudflare R2 signed uploads.
- Save media metadata.
- Enforce plan storage limits.
- Add archive/delete/hide-from-screen actions.
- Add thumbnail and video processing strategy.

## Sprint 4 - Realtime

- Choose provider: Supabase Realtime, Ably, Pusher or WebSocket service.
- Make live screen update without refresh.
- Update likes and blocked/archived media in realtime.

## Sprint 5 - Monetization

- Implement free, capsule and family plans.
- Add paid custom subdomains.
- Add extra GB purchases.
- Add Pix contribution settings per event.

## Sprint 6 - Production Hardening

- Admin 2FA.
- Audit logs.
- Cloudflare WAF and rate limits.
- Terms acceptance for public event conversion.
- Backup and recovery strategy.
