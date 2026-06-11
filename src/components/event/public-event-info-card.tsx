import type { Event } from "@/types/domain";
import { formatEventDateLong, formatEventSchedule } from "@/lib/events/format-event-date";
import { getRsvpDeadlineDate } from "@/lib/mural/timeline";

export function PublicEventInfoCard({
  event,
  showRsvpDeadlineNote = false
}: {
  event: Event;
  showRsvpDeadlineNote?: boolean;
}) {
  const schedule = formatEventSchedule(event.date, event.startsAt, event.endsAt);
  const dateLabel = formatEventDateLong(event.date);
  const organizer = event.organizerName;
  const honoree = event.hostName;
  const rsvpDeadline = showRsvpDeadlineNote ? getRsvpDeadlineDate(event) : null;
  const rsvpDeadlineLabel = rsvpDeadline
    ? rsvpDeadline.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <article className="public-event-card public-event-info-card">
      <header className="public-event-info-head">
        <h2 className="public-event-section-title">Informações do evento</h2>
        <p className="public-event-message">
          Tudo o que você precisa saber para comparecer com tranquilidade.
        </p>
      </header>

      <dl className="public-event-info-list public-event-info-list-rich">
        <div className="public-event-info-row">
          <dt>Quando</dt>
          <dd>
            <strong>{schedule}</strong>
            {dateLabel ? <span>Reserve na agenda: {dateLabel}.</span> : null}
            {event.startsAt ? (
              <span>
                Chegada sugerida: a partir das {event.startsAt}
                {event.endsAt ? ` · previsão de encerramento às ${event.endsAt}` : ""}.
              </span>
            ) : null}
          </dd>
        </div>

        <div className="public-event-info-row">
          <dt>{event.eventFormat === "online" ? "Como participar" : "Onde"}</dt>
          <dd>
            {event.eventFormat === "online" ? (
              <>
                <strong>Evento online</strong>
                {event.onlineMeetingUrl ? (
                  <>
                    <span>Acesse o link no horário marcado pelo computador ou celular.</span>
                    <a
                      className="public-event-info-link"
                      href={event.onlineMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir link do evento
                    </a>
                  </>
                ) : (
                  <span>O organizador publicará o link de acesso aqui quando estiver disponível.</span>
                )}
              </>
            ) : (
              <>
                <strong>{event.venueName}</strong>
                <span>{event.venueAddress}</span>
                {event.venueComplement ? <span>{event.venueComplement}</span> : null}
                {event.venueZip ? <span>CEP {event.venueZip}</span> : null}
                <span>{event.city}</span>
                <span className="public-event-info-note">Copie o endereço para usar em mapas ou transporte por aplicativo.</span>
              </>
            )}
          </dd>
        </div>

        {organizer || honoree ? (
          <div className="public-event-info-row">
            <dt>Quem convida</dt>
            <dd>
              {organizer && organizer !== honoree ? (
                <>
                  <span>
                    Organização: <strong>{organizer}</strong>
                  </span>
                  <span>
                    Homenageado(a): <strong>{honoree}</strong>
                  </span>
                </>
              ) : (
                <strong>{honoree}</strong>
              )}
            </dd>
          </div>
        ) : null}

        {rsvpDeadlineLabel ? (
          <div className="public-event-info-row public-event-info-row-highlight">
            <dt>Confirmação de presença</dt>
            <dd>
              <strong>Responda até {rsvpDeadlineLabel}</strong>
              <span>Depois dessa data, a confirmação online é encerrada e o link mostra a contagem para o evento.</span>
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
