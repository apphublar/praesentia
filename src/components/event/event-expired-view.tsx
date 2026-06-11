import type { Event } from "@/types/domain";
import { RETENTION_FREE_DESCRIPTION } from "@/lib/copy/retention";

export function EventExpiredView({ event }: { event: Event }) {
  return (
    <article className="public-event-card public-event-expired">
      <span className="public-event-kicker">Evento encerrado</span>
      <h1 className="public-event-title">{event.title}</h1>
      <p className="public-event-message">
        Este link gratuito ficou disponível apenas até o fim do evento. {RETENTION_FREE_DESCRIPTION}
      </p>
    </article>
  );
}
