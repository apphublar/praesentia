"use client";

import type { Event, GuestMessage, MediaItem } from "@/types/domain";
import { getInvitePhase } from "@/lib/mural/timeline";
import type { PublicEventViewMode } from "@/lib/mural/timeline";
import { EventExpiredView } from "@/components/event/event-expired-view";
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
  if (viewMode === "expired") {
    return <EventExpiredView event={event} />;
  }

  const invitePhase = getInvitePhase(event, needsRsvp);

  if (viewMode === "invite") {
    return (
      <PublicInviteView
        event={event}
        invitePhase={invitePhase}
        capsuleActive={capsuleActive}
        managerHref={managerHref}
        publicMessages={publicMessages}
      />
    );
  }

  if (viewMode === "live_mural") {
    return (
      <div className="public-event-stack">
        <PublicInviteView
          event={event}
          invitePhase="none"
          compactHeader
          capsuleActive={capsuleActive}
          publicMessages={[]}
          hideMessages
          hideGifts
        />
        {muralGuestRsvpId ? (
          <article className="public-event-card">
            <GuestLiveMural
              event={event}
              media={media}
              guestRsvpId={muralGuestRsvpId}
              guestName={muralGuestName}
              confirmedGuestCount={confirmedGuestCount}
            />
          </article>
        ) : (
          <MuralAccessPanel eventId={event.id} capsuleActive={capsuleActive} mode="live" />
        )}
      </div>
    );
  }

  if (viewMode === "memory_view") {
    return (
      <div className="public-event-stack">
        {muralGuestRsvpId ? (
          <>
            <article className="public-event-card public-event-memory-intro">
              <span className="public-event-kicker">Cápsula do tempo</span>
              <h2 className="public-event-section-title">{event.title}</h2>
              <p className="public-event-message">
                Reviva as memórias deste evento. O conteúdo só fica visível após entrar com seu e-mail e código de acesso.
              </p>
            </article>
            <article className="public-event-card">
              <GuestLiveMural
                event={event}
                media={media}
                guestRsvpId={muralGuestRsvpId}
                guestName={muralGuestName}
                readOnly
                confirmedGuestCount={confirmedGuestCount}
              />
            </article>
          </>
        ) : (
          <MuralAccessPanel eventId={event.id} capsuleActive={capsuleActive} mode="memory" />
        )}
      </div>
    );
  }

  return null;
}
