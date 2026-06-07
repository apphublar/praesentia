# Production Readiness

Praesentia handles private event data, guest identities, photos, videos, messages and payment state. Production must not be treated as a normal static deploy.

## Current Code-Side Protections

- Development login is disabled unless `ALLOW_DEV_AUTH_BYPASS=true` outside production.
- Session cookies are `httpOnly`, `sameSite=lax` and `secure` in production.
- Mutating API routes validate request origin in production.
- Security headers include CSP, HSTS in production, frame restrictions, referrer policy and permissions policy.
- Uploads validate content type, file size, event membership, per-guest limits and plan storage limits.
- Media storage usage is updated when media is created or deleted.
- Dashboard data goes through repositories instead of direct mock data.
- Admin page no longer displays mock operational metrics.

## Non-Negotiable Production Blockers

Do not launch to real users until these are complete:

1. Supabase Auth replaces development session flow.
2. Supabase Postgres is configured with production `DATABASE_URL`.
3. Cloudflare R2 bucket is private and upload URLs are signed.
4. Stripe checkout and webhook signature verification are implemented.
5. Resend domain is verified and transactional emails are tested.
6. Admin MFA is required.
7. Backups, logs, monitoring and incident alerts are active.
8. LGPD flows exist for consent, export and deletion.

## Required Vercel Environment Variables

Set these in Vercel Production, Preview and Development as appropriate:

- `APP_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://your-domain`
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `ADMIN_EMAILS`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_BUCKET`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `REALTIME_PROVIDER=supabase`
- `SENTRY_DSN` or equivalent error monitoring DSN

Never set `ALLOW_DEV_AUTH_BYPASS=true` in Vercel production.

## Supabase Setup

Detailed auth setup is in `docs/supabase-auth.md`.

1. Create the production project.
2. Run `docs/database-schema.sql`.
3. Enable Supabase Auth providers needed for launch.
4. Configure redirect URLs:
   - `https://your-domain/login`
   - `https://your-domain/auth/callback`
   - Vercel preview URLs only if previews need auth testing.
5. Enable email confirmation for public users.
6. Require MFA for admin accounts.
7. Review database policies before exposing client-side reads.
8. Enable daily backups and point-in-time recovery if available on the selected plan.

## Cloudflare Setup

1. Put DNS for the production domain on Cloudflare.
2. Enable HTTPS only, HSTS and managed WAF rules.
3. Create a private R2 bucket for media.
4. Create scoped R2 credentials for this app only.
5. Configure CORS to allow uploads only from the production domain.
6. Do not expose the R2 secret access key to the browser.

## Stripe Setup

1. Configure products/prices for each Praesentia plan.
2. Configure checkout success and cancel URLs.
3. Create webhook endpoint in production.
4. Store the webhook secret in `STRIPE_WEBHOOK_SECRET`.
5. Verify webhook signatures before changing plans or storage limits.
6. Test payment, failed payment, cancellation, upgrade and downgrade events.

## Resend Setup

1. Verify the sending domain.
2. Configure SPF, DKIM and DMARC.
3. Use a real sender in `RESEND_FROM_EMAIL`.
4. Test account confirmation, password recovery, invitation and RSVP emails.

## Operational Requirements

- Error monitoring with alerting.
- Audit logs for admin and owner actions.
- Upload abuse monitoring.
- Data retention and deletion process.
- Terms of use and privacy policy.
- Incident response process with owner contact and rollback plan.
