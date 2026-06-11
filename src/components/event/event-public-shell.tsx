"use client";

import type { Event, GuestMessage, MediaItem } from "@/types/domain";
import { getEventStartDate } from "@/lib/events/phase";
import type { PublicEventViewMode } from "@/lib/mural/timeline";
import { EventCountdown } from "@/components/event/event-countdown";
import { GuestLiveMural } from "@/components/event/guest-live-mural";
import { MuralAccessPanel } from "@/components/event/mural-access-panel";
import { PublicInviteView } from "@/components/event/public-invite-view";

export function EventPublicShell({
  event,
  viewMode,
  needsRsvp,
  capsuleActive,
  managerHref,
  publicMessages,
  media,
  muralGuestName,
  muralGuestRsvpId,
  confirmedGuestCount
}: {
  event: Event;
  viewMode: PublicEventViewMode;
  needsRsvp: boolean;
  capsuleActive: boolean;
  managerHref?: string;
  publicMessages: GuestMessage[];
  media: MediaItem[];
  muralGuestName?: string;
  muralGuestRsvpId?: string;
  confirmedGuestCount?: number;
}) {
  const eventStarted = new Date() >= getEventStartDate(event);
  const showInviteContent = viewMode === "rsvp_open" || viewMode === "countdown";
  const showRsvp = viewMode === "rsvp_open" && needsRsvp;

  return (
    <div className="public-event-stack">
      {showInviteContent ? (
        <PublicInviteView
          event={event}
          needsRsvp={showRsvp}
          capsuleActive={capsuleActive}
          managerHref={managerHref}
          publicMessages={publicMessages}
          hideMuralSection
        />
      ) : null}

      {viewMode === "countdown" ? (
        <EventCountdown event={event} label="Contagem para o evento" />
      ) : null}

      {viewMode === "live_mural" && !muralGuestRsvpId ? (
        <MuralAccessPanel eventId={event.id} capsuleActive={capsuleActive} eventStarted={eventStarted} />
      ) : null}

      {viewMode === "live_mural" && muralGuestRsvpId ? (
        <article className="public-event-card">
          <GuestLiveMural
            event={event}
            media={media}
            guestRsvpId={muralGuestRsvpId}
            guestName={muralGuestName}
            confirmedGuestCount={confirmedGuestCount}
          />
        </article>
      ) : null}

      {viewMode === "memory_view" ? (
        <article className="public-event-card">
          <GuestLiveMural
            event={event}
            media={media}
            guestName={muralGuestName}
            readOnly
            confirmedGuestCount={confirmedGuestCount}
          />
        </article>
      ) : null}
    </div>
  );
}
