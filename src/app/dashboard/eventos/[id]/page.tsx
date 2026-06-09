import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverGenerator } from "@/components/dashboard/cover-generator";
import { EventSettingsForms } from "@/components/dashboard/event-settings-forms";
import { EventSharePanel } from "@/components/dashboard/event-share-panel";
import { GuestListPanel } from "@/components/dashboard/guest-list-panel";
import { InviteTextEditor } from "@/components/dashboard/invite-text-editor";
import { LockedCapsulePreview } from "@/components/dashboard/locked-capsule-preview";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { OwnerMediaControls } from "@/components/event/owner-media-controls";
import { AppNav } from "@/components/layout/app-nav";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEventProfile } from "@/lib/events/event-profile";
import { getAiCoverQuota, getAiTextQuota, hasCapsuleAccess } from "@/lib/plans/features";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const event = await repositories.events.findById(id);
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const media = await repositories.media.listPublishedByEvent(event.id);
  const eventMembers = await repositories.members.listByEvent(event.id);
  const guestRsvps = await repositories.guestRsvps.listByEvent(event.id);
  const membership = await repositories.members.findMembership(event.id, session.user.id);
  const subscription = await repositories.subscriptions.findActiveByUser(session.user.id);
  const allowed = canManageEvent(session.user, membership ?? undefined);
  const capsuleActive = hasCapsuleAccess(event);
  const textQuota = getAiTextQuota(event);
  const coverQuota = getAiCoverQuota(event);

  return (
    <>
      <AppNav />
      <main className="shell paper dashboard-main" style={{ padding: "42px 0 90px" }}>
        <span className="pill">painel do evento · {event.plan.label}</span>
        <h1 className="display-i" style={{ fontSize: "clamp(36px, 6vw, 72px)", lineHeight: 0.94, margin: "14px 0 22px" }}>
          {event.title}
        </h1>

        {!allowed && (
          <section className="card dashboard-card" style={{ borderColor: "var(--coral)" }}>
            <h2 style={{ marginTop: 0 }}>Acesso negado</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
              Apenas o responsável ou um gestor do evento pode acessar este painel.
            </p>
          </section>
        )}

        {allowed && (
          <div className="dashboard-stack">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href={`/evento/${event.slug}`}>
                Abrir {profile.isFundraising ? "vaquinha" : "convite"} público
              </Link>
              <Link className="btn secondary" href={`/criar/continuar/${event.id}`}>
                Editar texto e imagem
              </Link>
              {capsuleActive && (
                <Link className="btn secondary" href={`/evento/${event.slug}/telao`}>
                  Abrir telão
                </Link>
              )}
            </div>

            <section className="grid dashboard-metrics">
              {profile.needsRsvp && <Metric label="Confirmados (RSVP)" value={String(guestRsvps.length)} />}
              {!profile.isFundraising && (
                <Metric label="Formato" value={event.eventFormat === "online" ? "Online" : event.eventFormat === "fundraising" ? "Vaquinha" : "Presencial"} />
              )}
              {profile.isFundraising && event.pix?.suggestedAmount ? (
                <Metric label="Meta Pix" value={`R$ ${event.pix.suggestedAmount.toLocaleString("pt-BR")}`} />
              ) : null}
              {capsuleActive && (
                <>
                  <Metric label="Mídias publicadas" value={String(media.length)} />
                  <Metric label="Curtidas totais" value={String(media.reduce((sum, item) => sum + item.likesCount, 0))} />
                </>
              )}
            </section>

            <div id={`ativar-capsula-${event.id}`}>
              <PlanUpgradePanel event={event} subscription={subscription} />
            </div>

            {!capsuleActive && <LockedCapsulePreview eventId={event.id} />}

            {capsuleActive && (
              <article className="card dashboard-card" style={{ background: "var(--bg-soft)" }}>
                <span className="pill">mural ao vivo</span>
                <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>Cápsula ativa</h2>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  Convidados confirmados podem publicar fotos e recados. Somente o responsável pode enviar vídeos.
                </p>
              </article>
            )}

            <InviteTextEditor
              eventId={event.id}
              eventSlug={event.slug}
              isFundraising={profile.isFundraising}
              initialCopy={event.inviteCopy}
              initialQuota={textQuota}
            />

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

            <EventSharePanel
              eventSlug={event.slug}
              eventTitle={event.title}
              coverUrl={event.coverImageUrl}
              whatsappText={event.inviteCopy?.whatsapp}
              headline={event.inviteCopy?.headline}
              message={event.inviteCopy?.message}
            />

            {profile.needsRsvp && <GuestListPanel eventId={event.id} initialRsvps={guestRsvps} />}

            <EventSettingsForms event={event} members={eventMembers} />

            {capsuleActive && <OwnerMediaControls items={media} />}
          </div>
        )}
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="card dashboard-card">
      <div style={{ color: "var(--ink-soft)", fontSize: 12, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
      <div className="display" style={{ fontSize: 42, marginTop: 8, lineHeight: 1 }}>{value}</div>
    </article>
  );
}
