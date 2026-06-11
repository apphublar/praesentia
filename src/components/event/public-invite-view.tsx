"use client";

import type { Event, GuestMessage } from "@/types/domain";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { formatEventSchedule } from "@/lib/events/format-event-date";
import { resolvePublicEventTheme } from "@/lib/events/event-theme-style";
import { GiftSuggestionsDisplay } from "@/components/event/gift-suggestions-display";
import { GuestMessageSection } from "@/components/event/guest-message-section";
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
  needsRsvp,
  capsuleActive,
  managerHref,
  publicMessages = [],
  hideMuralSection = false
}: {
  event: Event;
  needsRsvp: boolean;
  capsuleActive: boolean;
  managerHref?: string;
  publicMessages?: GuestMessage[];
  hideMuralSection?: boolean;
}) {
  const palette = resolvePublicEventTheme(event.theme, event.eventType);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? palette.label;
  const schedule = formatEventSchedule(event.date, event.startsAt, event.endsAt);
  const organizer = event.organizerName;
  const honoree = event.hostName;

  return (
    <div className="public-event-stack">
      <CoverBanner coverUrl={event.coverImageUrl} title={event.title} />

      <article className="public-event-card public-event-hero">
        <span className="public-event-kicker">
          {palette.emoji} {typeLabel}
        </span>
        <h1 className="public-event-title">{event.title}</h1>
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
      </article>

      <article className="public-event-card">
        <h2 className="public-event-section-title">Informações do evento</h2>
        <dl className="public-event-info-list">
          <div>
            <dt>Quando</dt>
            <dd>{schedule}</dd>
          </div>
          <div>
            <dt>Onde</dt>
            <dd>
              {event.eventFormat === "online" ? (
                event.onlineMeetingUrl ? (
                  <a href={event.onlineMeetingUrl} target="_blank" rel="noopener noreferrer">
                    Acessar evento online
                  </a>
                ) : (
                  "Evento online"
                )
              ) : (
                <>
                  <strong>{event.venueName}</strong>
                  <span>{event.venueAddress}</span>
                  {event.venueComplement ? <span>{event.venueComplement}</span> : null}
                  {event.venueZip ? <span>CEP {event.venueZip}</span> : null}
                  <span>{event.city}</span>
                </>
              )}
            </dd>
          </div>
          {organizer ? (
            <div>
              <dt>Organização</dt>
              <dd>{organizer}</dd>
            </div>
          ) : null}
          {organizer && organizer !== honoree ? (
            <div>
              <dt>Homenageado(a)</dt>
              <dd>{honoree}</dd>
            </div>
          ) : null}
        </dl>
      </article>

      {needsRsvp && event.rsvpEnabled !== false ? (
        <div className="public-event-card public-event-rsvp">
          <RsvpForm
            eventId={event.id}
            eventSlug={event.slug}
            eventTitle={event.title}
            capsuleAvailable={capsuleActive}
          />
        </div>
      ) : null}

      <GiftSuggestionsDisplay suggestions={event.giftSuggestions} />

      {event.pix?.enabled ? (
        <article className="public-event-card public-event-pix-card">
          <h2 className="public-event-section-title">Presentear</h2>
          <p className="public-event-message">
            Se quiser contribuir, use o Pix abaixo. O valor é livre — envie o que desejar.
          </p>
          <PixBox pix={event.pix} />
        </article>
      ) : null}

      {!hideMuralSection ? <GuestMessageSection eventId={event.id} initialPublicMessages={publicMessages} /> : null}

      {managerHref ? (
        <p className="public-event-manager-link">
          <a href={managerHref}>Painel do responsável</a>
        </p>
      ) : null}
    </div>
  );
}
