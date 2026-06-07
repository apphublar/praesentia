# Cloudflare R2 Setup

Praesentia stores event media in Cloudflare R2. Buckets should be private by default.

## Required Environment Variables

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_PUBLIC_BASE_URL=
```

`CLOUDFLARE_R2_PUBLIC_BASE_URL` can point to a controlled delivery domain when available. Until signed/private delivery is finalized, the app can still store the R2 key and use placeholders in development.

## Upload Flow

1. Client calls `POST /api/events/:eventId/media` with filename, content type and size.
2. API verifies account, confirmed RSVP, access status, MIME type and size.
3. API returns a short-lived signed R2 URL and an R2 key.
4. Client uploads directly to R2.
5. Client calls `POST /api/events/:eventId/media` with `action: "finalize_upload"`.
6. API creates the media record and publishes a realtime event.

## Security Rules

- Never expose R2 secret keys to the browser.
- Keep upload URLs short-lived.
- Validate MIME type and size before signing.
- Store media visibility in the database, not in the object path.
- Archiving content changes database visibility; deletion should also delete the R2 object in the production repository.
- Blocked guests cannot request signed uploads or finalize media.
