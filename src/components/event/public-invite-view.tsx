"use client";

import type { Event, GuestMessage } from "@/types/domain";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { resolvePublicEventTheme } from "@/lib/events/event-theme-style";
import type { PublicInvitePhase } from "@/lib/mural/timeline";
import { GiftSuggestionsDisplay } from "@/components/event/gift-suggestions-display";
import { GuestMessageSection } from "@/components/event/guest-message-section";
import { EventCountdown } from "@/components/event/event-countdown";
import { PublicEventInfoCard } from "@/components/event/public-event-info-card";
import { PixBox } from "@/components/event/pix-box";
import { RsvpForm } from "@/components/event/rsvp-form";

function CoverBanner({ coverUrl, title }: { coverUrl?: string; title: string }) {
  if (coverUrl) {
    return (
      <div className="public-event-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={`Convite de ${title}`} />
      </div>
    );
  }

  return (
    <div className="public-event-cover public-event-cover-fallback">
      <span className="public-event-cover-icon" aria-hidden="true">
        ✦
      </span>
    </div>
  );
}

export function PublicInviteView({
  event,
  invitePhase,
  capsuleActive,
  managerHref,
  publicMessages = [],
  hideMuralSection = false,
  hideMessages = false,
  hideGifts = false,
  compactHeader = false
}: {
  event: Event;
  invitePhase: PublicInvitePhase;
  capsuleActive: boolean;
  managerHref?: string;
  publicMessages?: GuestMessage[];
  hideMuralSection?: boolean;
  hideMessages?: boolean;
  hideGifts?: boolean;
  compactHeader?: boolean;
}) {
  const palette = resolvePublicEventTheme(event.theme, event.eventType);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? palette.label;
  const organizer = event.organizerName;
  const honoree = event.hostName;
  const showRsvp = invitePhase === "rsvp_open";
  const showCountdown = invitePhase === "countdown";

  return (
    <div className="public-event-stack">
      <CoverBanner coverUrl={event.coverImageUrl} title={event.title} />

      <article className={`public-event-card public-event-hero${compactHeader ? " is-compact" : ""}`}>
        <span className="public-event-kicker">
          {palette.emoji} {typeLabel}
        </span>
        <h1 className="public-event-title">{event.title}</h1>
        {!compactHeader ? (
          <>
            <p className="public-event-host">
              {organizer && organizer !== honoree ? (
                <>
                  Homenageado(a): <strong>{honoree}</strong> · Organização: <strong>{organizer}</strong>
                </>
              ) : (
                <>
                  Com carinho, <strong>{honoree}</strong>
                </>
              )}
            </p>
            {event.inviteCopy?.headline ? (
              <p className="public-event-headline">{event.inviteCopy.headline}</p>
            ) : null}
            {event.inviteCopy?.message ? (
              <p className="public-event-message">{event.inviteCopy.message}</p>
            ) : event.theme ? (
              <p className="public-event-message">Tema: {event.theme}</p>
            ) : null}
          </>
        ) : null}
      </article>

      {showRsvp ? (
        <div className="public-event-card public-event-rsvp public-event-primary-action">
          <div className="public-event-primary-kicker">Sua vez agora</div>
          <RsvpForm
            eventId={event.id}
            eventSlug={event.slug}
            eventTitle={event.title}
            rsvpDeadline={event.rsvpDeadline}
            capsuleAvailable={capsuleActive}
          />
        </div>
      ) : null}

      {showCountdown ? (
        <EventCountdown
          event={event}
          label="Confirmações encerradas"
          subtitle="O prazo para confirmar presença terminou. Falta pouco para o grande dia!"
        />
      ) : null}

      {!compactHeader ? (
        <PublicEventInfoCard event={event} showRsvpDeadlineNote={showRsvp} />
      ) : null}

      {!hideGifts ? <GiftSuggestionsDisplay suggestions={event.giftSuggestions} /> : null}

      {event.pix?.enabled ? (
        <article className="public-event-card public-event-pix-card">
          <h2 className="public-event-section-title">Presentear</h2>
          <p className="public-event-message">
            Se quiser contribuir, use o Pix abaixo. O valor é livre — envie o que desejar.
          </p>
          <PixBox pix={event.pix} />
        </article>
      ) : null}

      {!hideMuralSection && !hideMessages ? (
        <GuestMessageSection eventId={event.id} initialPublicMessages={publicMessages} />
      ) : null}

      {managerHref ? (
        <p className="public-event-manager-link">
          <a href={managerHref}>Painel do responsável</a>
        </p>
      ) : null}
    </div>
  );
}
