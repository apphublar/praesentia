import { notFound } from "next/navigation";
import { AdminCheckinPanel } from "@/components/app/admin/admin-checkin-panel";
import { AdminConfigPanel } from "@/components/app/admin/admin-config-panel";
import { AdminGuestsPanel } from "@/components/app/admin/admin-guests-panel";
import { AdminMuralPanel } from "@/components/app/admin/admin-mural-panel";
import { EventAdminPanel } from "@/components/app/event-admin-panel";
import { canManageEvent } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import { getEventProfile } from "@/lib/events/event-profile";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSession(`/dashboard/eventos/${id}`);
  const event = await safeRepositoryCall(() => repositories.events.findById(id), null, "events.findById");
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const [media, eventMembers, guestRsvps, membership, ownerId, subscription, account] = await Promise.all([
    safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent"),
    safeRepositoryCall(() => repositories.members.listByEvent(event.id), [], "members.listByEvent"),
    safeRepositoryCall(() => repositories.guestRsvps.listByEvent(event.id), [], "guestRsvps.listByEvent"),
    safeRepositoryCall(() => repositories.members.findMembership(event.id, session.user.id), null, "members.findMembership"),
    safeRepositoryCall(() => repositories.events.findOwnerId(event.id), null, "events.findOwnerId"),
    safeRepositoryCall(() => repositories.subscriptions.findActiveByUser(session.user.id), null, "subscriptions.findActiveByUser"),
    loadAiCoverAccountContext(session.user.id)
  ]);
  const allowed = canManageEvent(session.user, membership ?? undefined, ownerId);
  const coverQuota = getAiCoverQuota(event, account);

  if (!allowed) {
    return (
      <div className="card" style={{ margin: 32, padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Acesso negado</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.55 }}>
          Apenas o responsável ou um gestor do evento pode acessar este painel.
        </p>
      </div>
    );
  }

  return (
    <EventAdminPanel
      event={event}
      subscription={subscription}
      coverQuota={coverQuota}
      guestRsvps={guestRsvps}
      mediaCount={media.length}
      needsRsvp={profile.needsRsvp}
      convidadosPanel={<AdminGuestsPanel eventId={event.id} initialRsvps={guestRsvps} />}
      checkinPanel={
        <AdminCheckinPanel
          eventId={event.id}
          eventSlug={event.slug}
          eventFreeCode={event.freeCode}
          initialRsvps={guestRsvps}
        />
      }
      muralPanel={<AdminMuralPanel event={event} items={media} />}
      configPanel={
        <AdminConfigPanel
          event={event}
          members={eventMembers}
          capsuleActive={Boolean(event.capsuleActivatedAt)}
          needsRsvp={profile.needsRsvp}
        />
      }
    />
  );
}
