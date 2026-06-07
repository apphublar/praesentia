# Praesentia Architecture

Praesentia is a private-events platform with three product moments:

1. Before: AI-assisted invitation, RSVP, optional Pix contribution and private event link.
2. Live: authenticated confirmed guests publish photos, videos and messages; the screen mode updates in real time.
3. Memory: the same event becomes a 36-month digital capsule.

## Access Model

- Platform admin manages users, events, storage, abuse controls and plan settings.
- Event owner manages one event, Pix, guests, media, privacy and screen mode.
- Guest must have an account and confirmed RSVP to publish, like or access private memories.

## Blocking Rule

When an event owner blocks a guest, the guest loses access and all content previously shared by that guest becomes archived. Archived content is hidden from the event, capsule and live screen until the guest is unblocked or the owner decides otherwise.

## Storage

Cloudflare R2 stores original media. The database remains the source of truth for visibility, archival state, ownership, likes, screen eligibility and storage usage.

Upload flow:

1. A confirmed guest requests a signed upload URL.
2. The app validates membership, RSVP, file type and file size.
3. The guest uploads directly to Cloudflare R2.
4. The client finalizes the upload with the R2 key.
5. The app creates the media record and publishes a realtime event to the mural/screen.

## Realtime

The first implementation exposes `GET /api/events/:eventId/stream` using Server-Sent Events. This makes the live screen receive new media, updated media and like changes without refreshing the page.

For production scale, this adapter can be replaced by Ably, Pusher, Supabase Realtime or a dedicated WebSocket service.

## Paid URLs

- Free events use generated links such as `praesentia.com.br/e/k8d2m9`.
- Paid events may use custom subdomains such as `mavie1ano.praesentia.com.br`.
