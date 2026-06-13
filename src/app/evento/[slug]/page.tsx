import { notFound } from "next/navigation";
import { PublicEventLayout } from "@/components/event/public-event-layout";
import { EventPublicShell } from "@/components/event/event-public-shell";
import { VaquinhaPublicView } from "@/components/event/vaquinha-public-view";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession } from "@/lib/auth/session";
import { getEventProfile } from "@/lib/events/event-profile";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { getMuralSession } from "@/lib/mural/session";
import { getPublicEventViewMode } from "@/lib/mural/timeline";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const isFundraising = profile.isFundraising || event.eventFormat === "fundraising";
  const capsuleActive = hasCapsuleAccess(event);
  const session = await getCurrentSession();
  const canManage = session ? await canManageEventById(session.user, event.id) : false;
  const viewMode = getPublicEventViewMode(event);
  const muralSession = await getMuralSession(event.id);

  const collectedAmount = isFundraising && event.rsvpEnabled
    ? await safeRepositoryCall(() => repositories.guestRsvps.sumPixContributions(event.id), 0, "guestRsvps.sumPixContributions")
    : 0;
  const publicMessages = await safeRepositoryCall(
    () => repositories.guestMessages.listPublicByEvent(event.id),
    [],
    "guestMessages.listPublicByEvent"
  );
  const needsMuralContent =
    capsuleActive &&
    muralSession &&
    (viewMode === "live_mural" || viewMode === "memory_view");
  const media = needsMuralContent
    ? await safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent")
    : [];
  const confirmedGuestCount = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id).then((rows) => rows.filter((row) => row.rsvpStatus === "confirmed").length),
    0,
    "guestRsvps.listByEvent"
  );

  return (
    <>
      {isFundraising ? (
        <PublicEventLayout theme={event.theme} eventType={event.eventType}>
          <VaquinhaPublicView event={event} collectedAmount={collectedAmount} publicMessages={publicMessages} />
        </PublicEventLayout>
      ) : (
        <EventPublicShell
          event={event}
          viewMode={viewMode}
          needsRsvp={profile.needsRsvp}
          capsuleActive={capsuleActive}
          managerHref={canManage ? `/dashboard/eventos/${event.id}` : undefined}
          publicMessages={publicMessages}
          media={media}
          muralGuestName={muralSession?.guestName}
          muralGuestRsvpId={muralSession?.guestRsvpId}
          confirmedGuestCount={confirmedGuestCount}
        />
      )}
    </>
  );
}
