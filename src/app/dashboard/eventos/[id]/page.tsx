import { notFound } from "next/navigation";
import { EventAdminPanel } from "@/components/app/event-admin-panel";
import { loadManagedEventPage } from "@/lib/app/load-managed-event";
import { getCachedEventById } from "@/lib/db/cached-queries";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import { getEventProfile } from "@/lib/events/event-profile";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { session, event: managedEvent } = await loadManagedEventPage(id, `/dashboard/eventos/${id}`);
  const event = (await getCachedEventById(id)) ?? managedEvent;
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const [media, eventMembers, guestRsvps, subscription, account, muralAccessRequests] = await Promise.all([
    safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent"),
    safeRepositoryCall(() => repositories.members.listByEvent(event.id), [], "members.listByEvent"),
    safeRepositoryCall(() => repositories.guestRsvps.listByEvent(event.id), [], "guestRsvps.listByEvent"),
    safeRepositoryCall(() => repositories.subscriptions.findActiveByUser(session.user.id), null, "subscriptions.findActiveByUser"),
    loadAiCoverAccountContext(session.user.id),
    safeRepositoryCall(() => repositories.muralAccess.listAccessRequests(event.id), [], "muralAccess.listAccessRequests")
  ]);
  const coverQuota = getAiCoverQuota(event, account);

  return (
    <EventAdminPanel
      event={event}
      subscription={subscription}
      coverQuota={coverQuota}
      guestRsvps={guestRsvps}
      media={media}
      mediaCount={media.length}
      eventMembers={eventMembers}
      muralAccessRequests={muralAccessRequests}
      needsRsvp={profile.needsRsvp}
    />
  );
}
