# Prototype Parity Matrix

The legacy prototype is the product contract. The app in `src/` must not drop screens, sections or product rules from these files.

## Public Site

Source files:

- `site.jsx`
- `site-home.jsx`
- `site-home-extra.jsx`

Required sections:

- Header/nav with logo, links, login and create CTA.
- Hero with social proof and polaroid stack.
- Three-phase strip: before, live, memory.
- Four-step explanation.
- Storage/cotas section with free, capsule and family cards.
- Transformation strip: convite -> mural -> capsula.
- Featured capsules gallery.
- Life in capsules / long-term timeline.
- Privacy section.
- Printed album section.
- Full pricing section with dark premium stage, plan cards and GB extras.
- Final CTA.
- Full FAQ.
- Footer columns.

## Event Page

Source file:

- `site-event.jsx`

Required phases:

- `EventInvite`: before/invitation page.
- `EventLive`: live mural during event.
- `EventMemory`: permanent memory capsule.
- `PhaseSwitcher`.
- Pix contribution replacing gift-list behavior for the real MVP.
- Owner rules: archive/delete/hide/block.
- Likes are confidential.

## Creation Flow

Source file:

- `site-extras.jsx`

Required screens:

- `SiteCreate`: AI chat builder with step progress.
- AI messages with palette chips, text card, cover drafts and generated assets list.
- Live mobile preview.

## Profile

Source file:

- `site-extras.jsx`

Required screens:

- `SiteProfile`.
- Reminder banner.
- Profile stats.
- Connected presences.
- Year-by-year capsule timeline.
- Export/history note.

## Design Canvas / Artboards

Source files:

- `app.jsx`
- `direction-a.jsx`
- `direction-b.jsx`
- `flows.jsx`
- `memory.jsx`
- `design-canvas.jsx`

Required as product references, not necessarily public routes:

- Mobile and desktop invitation direction A.
- Mobile and desktop invitation direction B.
- RSVP confirmation.
- AI chat mobile and desktop.
- Live mural mobile.
- Upload mobile.
- Permanent memory desktop A and B.
- Permanent memory mobile.
- Timeline desktop.

## Current Rule

Whenever a section is simplified in `src/`, it should be treated as incomplete until it matches the source section's content density, hierarchy and product information.
