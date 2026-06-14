import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrototypeMuralView } from "@/components/app/guest/prototype-mural-view";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { getMuralSession } from "@/lib/mural/session";
import { getSchedulePhase } from "@/lib/mural/timeline";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function MuralPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!hasCapsuleAccess(event)) {
    return (
      <div className="prototype-guest-frame prototype-guest-frame-dark" style={{ padding: 40, textAlign: "center" }}>
        <h1 className="serif-i" style={{ fontSize: 32, color: "var(--paper)" }}>
          Mural indisponível
        </h1>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px", lineHeight: 1.5 }}>
          O mural ao vivo faz parte da Cápsula. Ative no painel do evento para liberar este recurso.
        </p>
        <Link className="btn btn-coral" href={`/dashboard/eventos/${event.id}`}>
          Ir ao painel do evento
        </Link>
      </div>
    );
  }

  if (getSchedulePhase(event) !== "live") {
    redirect(`/evento/${event.slug}`);
  }

  const muralSession = await getMuralSession(event.id);
  const media = await safeRepositoryCall(
    () => repositories.media.listPublishedByEvent(event.id),
    [],
    "media.listPublishedByEvent"
  );

  return (
    <div className="prototype-guest-frame prototype-guest-frame-dark">
      <PrototypeMuralView
        event={event}
        media={media}
        guestRsvpId={muralSession?.guestRsvpId}
        guestName={muralSession?.guestName}
        capsuleActive
      />
    </div>
  );
}
