import { notFound, redirect } from "next/navigation";
import { ContinueEventWizard } from "@/app/criar/continuar/continue-event-wizard";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getAiCoverQuota, getAiTextQuota } from "@/lib/plans/features";

export default async function DashboardContinueCreatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await requirePageSession("/dashboard/criar");
  const { eventId } = await params;
  const event = await repositories.events.findById(eventId);
  if (!event) notFound();

  const ownerId = await repositories.events.findOwnerId(event.id);
  if (ownerId !== session.user.id) redirect("/dashboard");

  return (
    <main className="dashboard-main">
      <section className="dashboard-page-header">
        <p className="dashboard-event-greeting">Finalizar convite</p>
        <h1 className="display-i dashboard-page-title">{event.title}</h1>
        <p className="dashboard-page-lead">
          Defina o texto, a imagem e compartilhe. Depois você gerencia tudo no painel do evento.
        </p>
      </section>

      <section className="card dashboard-card continue-wizard-shell">
        <ContinueEventWizard
          eventId={event.id}
          eventSlug={event.slug}
          eventTitle={event.title}
          eventHostName={event.hostName}
          eventOrganizerName={event.organizerName}
          eventTheme={event.theme}
          eventType={event.eventType}
          eventDate={event.date}
          eventStartsAt={event.startsAt}
          eventEndsAt={event.endsAt}
          eventVenueName={event.venueName}
          eventVenueAddress={event.venueAddress}
          eventVenueZip={event.venueZip}
          eventVenueComplement={event.venueComplement}
          eventCity={event.city}
          eventFormat={event.eventFormat}
          onlineMeetingUrl={event.onlineMeetingUrl}
          isFundraising={event.eventFormat === "fundraising"}
          initialCopy={event.inviteCopy}
          initialCoverUrl={event.coverImageUrl}
          initialHostPhotoUrl={event.hostPhotoUrl}
          textQuota={getAiTextQuota(event)}
          coverQuota={getAiCoverQuota(event)}
        />
      </section>
    </main>
  );
}
