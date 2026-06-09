import { notFound, redirect } from "next/navigation";
import { ContinueEventWizard } from "@/app/criar/continuar/continue-event-wizard";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getAiCoverQuota, getAiTextQuota } from "@/lib/plans/features";

export default async function ContinueCreatePage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login?next=/criar");

  const { eventId } = await params;
  const event = await repositories.events.findById(eventId);
  if (!event) notFound();

  const ownerId = await repositories.events.findOwnerId(event.id);
  if (ownerId !== session.user.id) redirect("/dashboard");

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "48px 0 90px", maxWidth: 720 }}>
        <span className="pill">finalizar convite</span>
        <h1 className="display-i" style={{ fontSize: "clamp(32px,5vw,52px)", lineHeight: 0.98, margin: "14px 0 12px" }}>
          {event.title}
        </h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: 28, lineHeight: 1.6 }}>
          Defina o texto, a imagem e compartilhe. Depois você gerencia tudo no painel do evento.
        </p>
        <ContinueEventWizard
          eventId={event.id}
          eventSlug={event.slug}
          eventTitle={event.title}
          isFundraising={event.eventFormat === "fundraising"}
          initialCopy={event.inviteCopy}
          initialCoverUrl={event.coverImageUrl}
          textQuota={getAiTextQuota(event)}
          coverQuota={getAiCoverQuota(event)}
        />
      </main>
    </>
  );
}
