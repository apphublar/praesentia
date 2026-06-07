# Security Plan

Security is part of the product foundation, not a final review step.

## Access Control

- Revalidate every permission on the backend.
- Do not rely on UI hiding or proxy/middleware alone.
- Event owners and managers can manage an event.
- Confirmed active guests can contribute and like.
- Blocked guests cannot access, contribute or like.
- Admin access must require 2FA before production.

## Uploads

- Cloudflare R2 buckets must be private.
- Uploads should use short-lived signed URLs.
- Validate MIME type and file size before signing.
- Keep the database as the source of truth for visibility.
- Strip or process sensitive metadata from photos before public delivery when the image pipeline is added.

## Rate Limits

Apply rate limits to:

- Login and signup.
- RSVP.
- Upload signing.
- Message publishing.
- Likes.
- Pix settings changes.
- Public-event activation.

## Sensitive Actions

Require reauthentication for:

- Changing Pix key.
- Making an event public.
- Changing custom subdomain.
- Deleting an event.
- Rotating the live-screen token.

## Event Owner Controls

Owner and manager endpoints must support:

- Blocking guests. This archives the guest's published content and removes it from the screen.
- Unblocking guests. This restores access, but archived content remains controlled by the owner.
- Archiving content without deleting the underlying object.
- Deleting content permanently.
- Hiding content from the live screen without removing it from the capsule.

## Cloudflare

Recommended production protections:

- WAF.
- DDoS protection.
- Rate limiting.
- Turnstile on authentication and suspicious flows.
- Bot protection.
- Strict cache rules for private media.

## Live Screen

- Use a revocable token for screen URLs.
- Keep screen URLs read-only.
- Do not expose owner/admin controls on screen routes.
- Archived or blocked-user content must disappear in realtime.
