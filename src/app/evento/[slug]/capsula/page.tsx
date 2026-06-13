import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrototypeCapsulaView } from "@/components/app/guest/prototype-capsula-view";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { getMuralSession } from "@/lib/mural/session";
import { getSchedulePhase } from "@/lib/mural/timeline";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function CapsulaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!hasCapsuleAccess(event)) {
    return (
      <div className="prototype-guest-frame" style={{ padding: 40, textAlign: "center" }}>
        <h1 className="serif-i" style={{ fontSize: 28 }}>
          Cápsula indisponível
        </h1>
        <p style={{ color: "var(--muted)", margin: "12px 0 24px", lineHeight: 1.5 }}>
          A cápsula do tempo faz parte do plano pago. O responsável precisa ativar antes ou durante o evento.
        </p>
        <Link className="btn btn-coral" href={`/evento/${event.slug}`}>
          Voltar ao convite
        </Link>
      </div>
    );
  }

  if (getSchedulePhase(event) !== "after") {
    redirect(`/evento/${event.slug}`);
  }

  const muralSession = await getMuralSession(event.id);
  const media = muralSession
    ? await safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent")
    : [];
  const confirmedGuestCount = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id).then((rows) => rows.filter((row) => row.rsvpStatus === "confirmed").length),
    0,
    "guestRsvps.listByEvent"
  );

  return (
    <div className="prototype-guest-frame">
      <PrototypeCapsulaView
        event={event}
        media={media}
        guestRsvpId={muralSession?.guestRsvpId}
        guestName={muralSession?.guestName}
        confirmedGuestCount={confirmedGuestCount}
      />
    </div>
  );
}
