import { notFound } from "next/navigation";
import { PortariaPanel } from "@/components/event/portaria-panel";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { formatEventDateLine } from "@/lib/events/format-event-date";

export default async function PortariaPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const token = typeof sp.token === "string" ? sp.token : null;

  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!token || token !== event.freeCode) {
    return (
      <main className="portaria-page portaria-page-locked">
        <section className="portaria-lock-card">
          <div className="portaria-lock-icon" aria-hidden="true">🔒</div>
          <h1>Link de check-in inválido</h1>
          <p>
            Este endereço não está autorizado para check-in. Peça ao organizador do evento o link correto.
          </p>
        </section>
      </main>
    );
  }

  const rsvps = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id),
    [],
    "guestRsvps.listByEvent"
  );

  const eventDate = formatEventDateLine(event.date);

  return (
    <main className="portaria-page">
      <div className="portaria-shell">
        <header className="portaria-header">
          <span className="portaria-kicker">Check-in dos convidados</span>
          <h1>{event.title}</h1>
          <p className="portaria-subtitle">
            {event.hostName}
            {eventDate ? ` · ${eventDate}` : ""}
            {event.startsAt ? ` · ${event.startsAt}` : ""}
          </p>
          <p className="portaria-help">
            Busque pelo nome, confirme a entrada e registre convidado + acompanhante juntos quando houver.
          </p>
        </header>

        <PortariaPanel eventId={event.id} token={token} initialRsvps={rsvps} />
      </div>
    </main>
  );
}
