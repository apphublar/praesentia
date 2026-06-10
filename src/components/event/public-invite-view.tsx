"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { formatEventSchedule } from "@/lib/events/format-event-date";
import { resolvePublicEventTheme } from "@/lib/events/event-theme-style";
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
  managerHref
}: {
  event: Event;
  needsRsvp: boolean;
  capsuleActive: boolean;
  managerHref?: string;
}) {
  const palette = resolvePublicEventTheme(event.theme, event.eventType);
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? palette.label;
  const schedule = formatEventSchedule(event.date, event.startsAt, event.endsAt);

  return (
    <div className="public-event-stack">
      <CoverBanner coverUrl={event.coverImageUrl} title={event.title} />

      <article className="public-event-card public-event-hero">
        <span className="public-event-kicker">
          {palette.emoji} {typeLabel}
        </span>
        <h1 className="public-event-title">{event.title}</h1>
        <p className="public-event-host">
          Com carinho, <strong>{event.hostName}</strong>
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
                  <span>{event.city}</span>
                </>
              )}
            </dd>
          </div>
          {event.hostName ? (
            <div>
              <dt>Organização</dt>
              <dd>{event.hostName}</dd>
            </div>
          ) : null}
        </dl>
      </article>

      {needsRsvp ? (
        <div className="public-event-card public-event-rsvp">
          <RsvpForm
            eventId={event.id}
            eventSlug={event.slug}
            eventTitle={event.title}
            capsuleAvailable={capsuleActive}
          />
        </div>
      ) : null}

      {event.pix?.enabled ? (
        <article className="public-event-card public-event-pix-card">
          <h2 className="public-event-section-title">Presentear</h2>
          <p className="public-event-message">
            Se quiser contribuir, use o Pix abaixo. O valor é livre — envie o que desejar.
          </p>
          <PixBox pix={event.pix} />
        </article>
      ) : null}

      {managerHref ? (
        <p className="public-event-manager-link">
          <a href={managerHref}>Painel do responsável</a>
        </p>
      ) : null}
    </div>
  );
}
