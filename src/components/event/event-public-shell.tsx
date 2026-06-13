"use client";

import type { Event, GuestMessage, MediaItem } from "@/types/domain";
import { PrototypeCapsulaView } from "@/components/app/guest/prototype-capsula-view";
import { PrototypeMuralView } from "@/components/app/guest/prototype-mural-view";
import { PrototypePublicInviteView } from "@/components/app/guest/prototype-public-invite-view";
import { getInvitePhase } from "@/lib/mural/timeline";
import type { PublicEventViewMode } from "@/lib/mural/timeline";
import { EventExpiredView } from "@/components/event/event-expired-view";

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
    return (
      <div className="prototype-guest-frame">
        <EventExpiredView event={event} />
      </div>
    );
  }

  const invitePhase = getInvitePhase(event, needsRsvp);

  if (viewMode === "invite") {
    return (
      <div className="prototype-guest-frame">
        <PrototypePublicInviteView
          event={event}
          invitePhase={invitePhase}
          capsuleActive={capsuleActive}
          managerHref={managerHref}
          publicMessages={publicMessages}
        />
      </div>
    );
  }

  if (viewMode === "live_mural") {
    return (
      <div className="prototype-guest-frame prototype-guest-frame-dark">
        <PrototypeMuralView
          event={event}
          media={media}
          guestRsvpId={muralGuestRsvpId}
          guestName={muralGuestName}
          capsuleActive={capsuleActive}
        />
      </div>
    );
  }

  if (viewMode === "memory_view") {
    return (
      <div className="prototype-guest-frame">
        <PrototypeCapsulaView
          event={event}
          media={media}
          guestRsvpId={muralGuestRsvpId}
          guestName={muralGuestName}
          confirmedGuestCount={confirmedGuestCount}
        />
      </div>
    );
  }

  return null;
}
