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

### Produtos e preços (BRL)

| Variável | Produto | Valor | Modo checkout |
|----------|---------|-------|---------------|
| `STRIPE_PRICE_CAPSULE` | Cápsula Praesentia | R$ 59 | pagamento único |
| `STRIPE_PRICE_PLUS_YEARLY` | Cápsula Plus | R$ 197/ano | assinatura anual |
| `STRIPE_PRICE_STORAGE_5GB` | +5 GB | R$ 19 | pagamento único |
| `STRIPE_PRICE_STORAGE_10GB` | +10 GB | R$ 29 | pagamento único |
| `STRIPE_PRICE_STORAGE_25GB` | +25 GB | R$ 49 | pagamento único |
| `STRIPE_PRICE_STORAGE_50GB` | +50 GB | R$ 89 | pagamento único |
| `STRIPE_PRICE_AI_INSPIRACAO` | Convite IA Inspiração | R$ 9,90 | pagamento único |
| `STRIPE_PRICE_AI_CRIATIVO` | Convite IA Criativo | R$ 29,90 | pagamento único |

**Test mode (local):**

1. Crie conta em [Stripe Dashboard](https://dashboard.stripe.com) e copie `sk_test_...` e `pk_test_...`.
2. Rode `npm run stripe:bootstrap-prices` (lê `.env.local` ou variável `STRIPE_SECRET_KEY`).
3. Cole os Price IDs retornados em `.env.local`.
4. Webhook local: `stripe listen --forward-to localhost:3000/api/billing/webhook/stripe` → `STRIPE_WEBHOOK_SECRET=whsec_...`.
5. Teste: upsell IA → Cápsula → ampliar storage; confirme liberação após `checkout.session.completed`.

**Produção:**

1. Recrie os mesmos produtos em **live mode** (ou duplique manualmente no Dashboard).
2. Webhook: `https://your-domain/api/billing/webhook/stripe`, evento `checkout.session.completed`.
3. URLs de sucesso/cancelamento são montadas em código (`/dashboard/pagamentos`, `/dashboard/eventos/:id`).
4. Verifique assinatura do webhook antes de alterar planos ou storage.
5. Teste pagamento ok, cancelado e webhook duplicado.

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
