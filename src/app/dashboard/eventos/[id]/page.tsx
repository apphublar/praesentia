import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverGenerator } from "@/components/dashboard/cover-generator";
import { DashboardEventHeader } from "@/components/dashboard/dashboard-event-header";
import { EventSetupChecklist } from "@/components/dashboard/event-setup-checklist";
import { EventSettingsForms } from "@/components/dashboard/event-settings-forms";
import { EventSharePanel } from "@/components/dashboard/event-share-panel";
import { GuestListPanel } from "@/components/dashboard/guest-list-panel";
import { InviteTextEditor } from "@/components/dashboard/invite-text-editor";
import { LockedCapsulePreview } from "@/components/dashboard/locked-capsule-preview";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { OwnerMediaControls } from "@/components/event/owner-media-controls";
import { canManageEvent } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { getEventProfile } from "@/lib/events/event-profile";
import { getAiCoverQuota, getAiTextQuota, hasCapsuleAccess } from "@/lib/plans/features";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePageSession(`/dashboard/eventos/${id}`);
  const event = await repositories.events.findById(id);
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const media = await safeRepositoryCall(
    () => repositories.media.listPublishedByEvent(event.id),
    [],
    "media.listPublishedByEvent"
  );
  const eventMembers = await safeRepositoryCall(
    () => repositories.members.listByEvent(event.id),
    [],
    "members.listByEvent"
  );
  const guestRsvps = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id),
    [],
    "guestRsvps.listByEvent"
  );
  const membership = await safeRepositoryCall(
    () => repositories.members.findMembership(event.id, session.user.id),
    null,
    "members.findMembership"
  );
  const ownerId = await safeRepositoryCall(
    () => repositories.events.findOwnerId(event.id),
    null,
    "events.findOwnerId"
  );
  const subscription = await safeRepositoryCall(
    () => repositories.subscriptions.findActiveByUser(session.user.id),
    null,
    "subscriptions.findActiveByUser"
  );
  const allowed = canManageEvent(session.user, membership ?? undefined, ownerId);
  const capsuleActive = hasCapsuleAccess(event);
  const textQuota = getAiTextQuota(event);
  const coverQuota = getAiCoverQuota(event);

  return (
    <main className="dashboard-main">
      {!allowed && (
        <section className="card dashboard-card dashboard-denied">
          <h2 style={{ marginTop: 0 }}>Acesso negado</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
            Apenas o responsável ou um gestor do evento pode acessar este painel.
          </p>
        </section>
      )}

      {allowed && (
        <>
          <DashboardEventHeader
            user={session.user}
            event={event}
            profile={profile}
            guestCount={guestRsvps.length}
            mediaCount={media.length}
            capsuleActive={capsuleActive}
          />

          <EventSetupChecklist
            event={event}
            profile={profile}
            capsuleActive={capsuleActive}
            guestCount={guestRsvps.length}
          />

          <div className="dashboard-sections">
            <section id="secao-texto" className="dashboard-section">
              <InviteTextEditor
                eventId={event.id}
                eventSlug={event.slug}
                isFundraising={profile.isFundraising}
                initialCopy={event.inviteCopy}
                initialQuota={textQuota}
              />
            </section>

            <section id="secao-capa" className="dashboard-section">
              <CoverGenerator
                eventId={event.id}
                eventSlug={event.slug}
                planTier={event.plan.tier}
                capsuleActive={capsuleActive}
                currentCoverUrl={event.coverImageUrl}
                coverSource={event.coverSource}
                pendingUrls={event.aiCoverPendingUrls}
                inviteWhatsappText={event.inviteCopy?.whatsapp}
                initialQuota={coverQuota}
              />
            </section>

            <section id="secao-compartilhar" className="dashboard-section">
              <EventSharePanel
                eventSlug={event.slug}
                eventTitle={event.title}
                coverUrl={event.coverImageUrl}
                whatsappText={event.inviteCopy?.whatsapp}
                headline={event.inviteCopy?.headline}
                message={event.inviteCopy?.message}
              />
            </section>

            {profile.needsRsvp ? (
              <section id="secao-rsvp" className="dashboard-section">
                <GuestListPanel eventId={event.id} initialRsvps={guestRsvps} />
              </section>
            ) : null}

            <section id="secao-configuracoes" className="dashboard-section">
              <EventSettingsForms event={event} members={eventMembers} />
            </section>

            <section id="secao-capsula" className="dashboard-section">
              <div id={`ativar-capsula-${event.id}`}>
                <PlanUpgradePanel event={event} subscription={subscription} />
              </div>
              {!capsuleActive && <LockedCapsulePreview eventId={event.id} />}
              {capsuleActive && (
                <article className="card dashboard-card" style={{ background: "var(--bg-soft)" }}>
                  <span className="pill">cápsula ativa</span>
                  <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>
                    Mural, telão e cápsula liberados
                  </h2>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 16 }}>
                    Convidados confirmados podem publicar fotos e recados. Somente o responsável pode enviar vídeos.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link className="btn secondary" href={`/evento/${event.slug}/telao`}>
                      Abrir telão
                    </Link>
                    <Link className="btn secondary" href={`/evento/${event.slug}`}>
                      Ver convite público
                    </Link>
                  </div>
                </article>
              )}
            </section>

            {capsuleActive ? (
              <section id="secao-mural" className="dashboard-section">
                <OwnerMediaControls items={media} />
              </section>
            ) : null}
          </div>
        </>
      )}
    </main>
  );
}
