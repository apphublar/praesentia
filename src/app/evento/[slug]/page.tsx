import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicEventLayout } from "@/components/event/public-event-layout";
import { PublicInviteView } from "@/components/event/public-invite-view";
import { PublicLiveMural } from "@/components/event/public-live-mural";
import { VaquinhaPublicView } from "@/components/event/vaquinha-public-view";
import { canManageEventById } from "@/lib/auth/event-access";
import { canContribute } from "@/lib/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { getEventProfile } from "@/lib/events/event-profile";
import { formatEventDateShort } from "@/lib/events/format-event-date";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const isFundraising = profile.isFundraising || event.eventFormat === "fundraising";
  const capsuleActive = hasCapsuleAccess(event);
  const session = await getCurrentSession();
  const membership = session
    ? await safeRepositoryCall(
        () => repositories.members.findMembership(event.id, session.user.id),
        null,
        "members.findMembership"
      )
    : null;
  const canManage = session ? await canManageEventById(session.user, event.id) : false;
  const canUseMural = session ? canContribute(event, membership ?? undefined) : false;
  const media = capsuleActive && canUseMural
    ? await safeRepositoryCall(() => repositories.media.listPublishedByEvent(event.id), [], "media.listPublishedByEvent")
    : [];

  const deadlineLabel = formatEventDateShort(event.date) ?? undefined;

  return (
    <PublicEventLayout theme={event.theme} eventType={event.eventType}>
      {isFundraising ? (
        <VaquinhaPublicView
          title={event.title}
          hostName={event.hostName}
          story={event.inviteCopy?.message ?? event.pix?.message}
          goalAmount={event.pix?.suggestedAmount}
          pixKey={event.pix?.key}
          pixReceiverName={event.pix?.receiverName}
          pixMessage={event.pix?.message}
          deadlineLabel={deadlineLabel}
          coverUrl={event.coverImageUrl}
        />
      ) : (
        <div className="public-event-stack">
          <PublicInviteView
            event={event}
            needsRsvp={profile.needsRsvp}
            capsuleActive={capsuleActive}
            managerHref={canManage ? `/dashboard/eventos/${event.id}` : undefined}
          />

          {capsuleActive && session && canUseMural ? (
            <PublicLiveMural
              event={event}
              media={media}
              currentUserId={session.user.id}
              canUploadVideo={canManage}
            />
          ) : capsuleActive && session && membership && membership.rsvpStatus !== "confirmed" ? (
            <article className="public-event-card">
              <h2 className="public-event-section-title">Mural ao vivo</h2>
              <p className="public-event-message">Confirme sua presença acima para participar do mural durante o evento.</p>
            </article>
          ) : capsuleActive && !session ? (
            <article className="public-event-card">
              <h2 className="public-event-section-title">Mural ao vivo</h2>
              <p className="public-event-message">
                Durante o evento, convidados confirmados podem publicar fotos e recados em tempo real.
              </p>
              <Link className="btn public-rsvp-action" href={`/login?next=/evento/${event.slug}`}>
                Entrar ou criar conta
              </Link>
            </article>
          ) : null}
        </div>
      )}
    </PublicEventLayout>
  );
}
