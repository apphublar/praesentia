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
          Confira data, horário e local para se organizar. Os detalhes abaixo são os mesmos do convite.
        </p>
      </header>

      <div className="public-event-info-grid">
        <section className="public-event-info-item">
          <span className="public-event-info-icon" aria-hidden="true">
            📅
          </span>
          <div>
            <h3>Quando</h3>
            <p className="public-event-info-value">{schedule}</p>
            {dateLabel ? <p className="public-event-info-hint">Marque na sua agenda: {dateLabel}.</p> : null}
            {event.startsAt ? (
              <p className="public-event-info-hint">
                Horário informado pelo organizador: início às {event.startsAt}
                {event.endsAt ? ` · previsão de término às ${event.endsAt}` : ""}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="public-event-info-item">
          <span className="public-event-info-icon" aria-hidden="true">
            {event.eventFormat === "online" ? "💻" : "📍"}
          </span>
          <div>
            <h3>{event.eventFormat === "online" ? "Como participar" : "Onde"}</h3>
            {event.eventFormat === "online" ? (
              <>
                <p className="public-event-info-value">Evento online</p>
                {event.onlineMeetingUrl ? (
                  <p className="public-event-info-hint">
                    No horário marcado, acesse o link abaixo pelo computador ou celular.
                  </p>
                ) : (
                  <p className="public-event-info-hint">
                    O organizador enviará o link de acesso mais perto da data, se ainda não estiver aqui.
                  </p>
                )}
                {event.onlineMeetingUrl ? (
                  <a
                    className="btn secondary public-event-info-link-btn"
                    href={event.onlineMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir link do evento
                  </a>
                ) : null}
              </>
            ) : (
              <>
                <p className="public-event-info-value">{event.venueName}</p>
                <p className="public-event-info-detail">{event.venueAddress}</p>
                {event.venueComplement ? <p className="public-event-info-detail">{event.venueComplement}</p> : null}
                {event.venueZip ? <p className="public-event-info-detail">CEP {event.venueZip}</p> : null}
                <p className="public-event-info-detail">{event.city}</p>
                <p className="public-event-info-hint">Use o endereço acima em mapas e aplicativos de transporte.</p>
              </>
            )}
          </div>
        </section>

        {organizer || honoree ? (
          <section className="public-event-info-item">
            <span className="public-event-info-icon" aria-hidden="true">
              ✦
            </span>
            <div>
              <h3>Quem convida</h3>
              {organizer && organizer !== honoree ? (
                <>
                  <p className="public-event-info-value">Organização: {organizer}</p>
                  <p className="public-event-info-detail">Homenageado(a): {honoree}</p>
                </>
              ) : (
                <p className="public-event-info-value">{honoree}</p>
              )}
            </div>
          </section>
        ) : null}

        {rsvpDeadlineLabel ? (
          <section className="public-event-info-item public-event-info-item-note">
            <span className="public-event-info-icon" aria-hidden="true">
              ⏳
            </span>
            <div>
              <h3>Confirmação de presença</h3>
              <p className="public-event-info-value">Responda até {rsvpDeadlineLabel}</p>
              <p className="public-event-info-hint">
                Depois dessa data, a confirmação online é encerrada — mas você ainda verá a contagem para o grande dia.
              </p>
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
