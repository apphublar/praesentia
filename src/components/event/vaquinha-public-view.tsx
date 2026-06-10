"use client";

import { PixBox } from "@/components/event/pix-box";

export function VaquinhaPublicView({
  title,
  hostName,
  story,
  goalAmount,
  pixKey,
  pixReceiverName,
  pixMessage,
  deadlineLabel,
  coverUrl
}: {
  title: string;
  hostName: string;
  story?: string;
  goalAmount?: number;
  pixKey?: string;
  pixReceiverName?: string;
  pixMessage?: string;
  deadlineLabel?: string;
  coverUrl?: string;
}) {
  return (
    <div className="public-event-stack">
      {coverUrl ? (
        <div className="public-event-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt={`Vaquinha ${title}`} />
        </div>
      ) : null}

      <article className="public-event-card public-event-hero">
        <span className="public-event-kicker">💚 Vaquinha</span>
        <h1 className="public-event-title">{title}</h1>
        <p className="public-event-host">
          Organizado por <strong>{hostName}</strong>
          {deadlineLabel ? <> · prazo: {deadlineLabel}</> : null}
        </p>
      </article>

      {goalAmount ? (
        <article className="public-event-card public-event-goal">
          <span className="public-event-goal-label">Meta da arrecadação</span>
          <strong className="public-event-goal-value">R$ {goalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}</strong>
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

      {pixKey ? (
        <article className="public-event-card public-event-pix-card">
          <h2 className="public-event-section-title">Contribuir via Pix</h2>
          <p className="public-event-message">
            Recebedor: <strong>{pixReceiverName ?? hostName}</strong>
          </p>
          {pixMessage ? <p className="public-event-message">{pixMessage}</p> : null}
          <PixBox
            pix={{
              enabled: true,
              receiverName: pixReceiverName ?? hostName,
              key: pixKey,
              suggestedAmount: goalAmount,
              message: pixMessage
            }}
          />
        </article>
      ) : null}
    </div>
  );
}
