"use client";

import type { Event, GuestMessage } from "@/types/domain";
import { FundraisingProgress } from "@/components/event/fundraising-progress";
import { GiftSuggestionsDisplay } from "@/components/event/gift-suggestions-display";
import { GuestMessageSection } from "@/components/event/guest-message-section";
import { PixBox } from "@/components/event/pix-box";
import { RsvpForm } from "@/components/event/rsvp-form";

export function VaquinhaPublicView({
  event,
  collectedAmount = 0,
  publicMessages = []
}: {
  event: Event;
  collectedAmount?: number;
  publicMessages?: GuestMessage[];
}) {
  const goalAmount = event.pix?.goalAmount ?? event.pix?.suggestedAmount;
  const story = event.inviteCopy?.message ?? event.pix?.message;
  const organizer = event.organizerName ?? event.hostName;

  return (
    <div className="public-event-stack">
      {event.coverImageUrl ? (
        <div className="public-event-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.coverImageUrl} alt={`Vaquinha ${event.title}`} />
        </div>
      ) : null}

      <article className="public-event-card public-event-hero">
        <span className="public-event-kicker">💚 Vaquinha</span>
        <h1 className="public-event-title">{event.title}</h1>
        <p className="public-event-host">
          Organizado por <strong>{organizer}</strong>
        </p>
      </article>

      {goalAmount ? (
        <article className="public-event-card public-event-goal">
          <span className="public-event-goal-label">Meta total a arrecadar</span>
          <strong className="public-event-goal-value">
            R$ {goalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </strong>
          <FundraisingProgress goalAmount={goalAmount} collectedAmount={collectedAmount} />
          <p className="public-event-message">
            Contribuições são feitas diretamente via Pix para o organizador. A Praesentia não intermedia valores.
          </p>
        </article>
      ) : null}

      {story ? (
        <article className="public-event-card">
          <h2 className="public-event-section-title">História</h2>
          <p className="public-event-message">{story}</p>
        </article>
      ) : null}

      {event.pix?.enabled && event.pix.key ? (
        <article className="public-event-card public-event-pix-card">
          <h2 className="public-event-section-title">Contribuir via Pix</h2>
          <PixBox pix={event.pix} fundraising />
        </article>
      ) : null}

      {event.rsvpEnabled ? (
        <div className="public-event-card public-event-rsvp">
          <RsvpForm
            eventId={event.id}
            eventSlug={event.slug}
            eventTitle={event.title}
            collectPixAmount
            minPerPerson={event.pix?.minPerPerson}
          />
        </div>
      ) : null}

      <GiftSuggestionsDisplay suggestions={event.giftSuggestions} />

      <GuestMessageSection eventId={event.id} initialPublicMessages={publicMessages} />
    </div>
  );
}
