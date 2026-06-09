import Link from "next/link";
import { notFound } from "next/navigation";
import { EventSettingsForms } from "@/components/dashboard/event-settings-forms";
import { CoverGenerator } from "@/components/dashboard/cover-generator";
import { InviteTextGenerator } from "@/components/dashboard/invite-text-generator";
import { GuestListPanel } from "@/components/dashboard/guest-list-panel";
import { PlanUpgradePanel } from "@/components/dashboard/plan-upgrade-panel";
import { OwnerMediaControls } from "@/components/event/owner-media-controls";
import { AppNav } from "@/components/layout/app-nav";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getAiCoverQuota, getAiTextQuota, hasCapsuleAccess } from "@/lib/plans/features";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const event = await repositories.events.findById(id);
  if (!event) notFound();

  const media = await repositories.media.listPublishedByEvent(event.id);
  const eventMembers = await repositories.members.listByEvent(event.id);
  const guestRsvps = await repositories.guestRsvps.listByEvent(event.id);
  const membership = await repositories.members.findMembership(event.id, session.user.id);
  const subscription = await repositories.subscriptions.findActiveByUser(session.user.id);
  const allowed = canManageEvent(session.user, membership ?? undefined);
  const capsuleActive = hasCapsuleAccess(event);
  const aiQuota = getAiCoverQuota(event);
  const textQuota = getAiTextQuota(event);

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "42px 0 90px" }}>
        <span className="pill">gestao do evento · {event.plan.label}</span>
        <h1 className="display-i" style={{ fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 0.94, margin: "14px 0 22px" }}>
          {event.title}
        </h1>

        {!allowed && (
          <section className="card" style={{ padding: 22, marginBottom: 24, borderColor: "var(--coral)" }}>
            <h2 style={{ marginTop: 0 }}>Acesso negado</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
              Apenas o responsavel ou um gestor do evento pode acessar este painel.
            </p>
          </section>
        )}

        {allowed && (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <Link className="btn" href={`/evento/${event.slug}`}>
                Abrir convite
              </Link>
              {capsuleActive && (
                <Link className="btn secondary" href={`/evento/${event.slug}/telao`}>
                  Abrir telao
                </Link>
              )}
            </div>

            <PlanUpgradePanel event={event} subscription={subscription} />

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 24 }}>
              <Metric label="Confirmados (RSVP)" value={String(guestRsvps.length)} />
              {capsuleActive && (
                <>
                  <Metric label="Midias publicadas" value={String(media.length)} />
                  <Metric label="Curtidas totais" value={String(media.reduce((sum, item) => sum + item.likesCount, 0))} />
                  <Metric label="Armazenamento" value={`${event.storageUsedGb.toFixed(1)}/${event.plan.storageGb} GB`} />
                </>
              )}
              {!capsuleActive && <Metric label="Formato" value={event.eventFormat === "online" ? "Online" : "Presencial"} />}
            </section>

            {capsuleActive && (
              <section className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24 }}>
                <article className="card" style={{ padding: 22 }}>
                  <span className="pill">armazenamento</span>
                  <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>{event.storageUsedGb.toFixed(1)} GB usados</h2>
                  <div style={{ height: 10, borderRadius: 999, background: "var(--bg-soft)", overflow: "hidden" }}>
                    <span
                      style={{
                        display: "block",
                        height: "100%",
                        width: `${Math.min(100, (event.storageUsedGb / event.plan.storageGb) * 100)}%`,
                        background: "var(--coral)",
                        borderRadius: 999
                      }}
                    />
                  </div>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
                    Plano {event.plan.label}: {event.plan.storageGb} GB.
                    {event.plan.yearlyEventLimit
                      ? ` No ${event.plan.label}, os ${event.plan.storageGb} GB sao compartilhados entre ate ${event.plan.yearlyEventLimit} eventos.`
                      : " Cada evento mantem sua capsula separada."}
                  </p>
                </article>
                <article className="card" style={{ padding: 22, background: "var(--bg-soft)" }}>
                  <span className="pill">mural ao vivo</span>
                  <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>Cápsula ativa</h2>
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
                    Convidados confirmados podem publicar fotos, videos e recados. O telao atualiza em tempo real.
                    Apos o evento, o mesmo link vira cápsula do tempo por 36 meses.
                  </p>
                </article>
              </section>
            )}

            <InviteTextGenerator
              eventId={event.id}
              eventSlug={event.slug}
              capsuleActive={capsuleActive}
              planTier={event.plan.tier}
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
              initialQuota={aiQuota}
            />

            <GuestListPanel eventId={event.id} initialRsvps={guestRsvps} />

            <EventSettingsForms event={event} members={eventMembers} />
            {capsuleActive && <OwnerMediaControls items={media} />}
          </>
        )}
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="card" style={{ padding: 20 }}>
      <div style={{ color: "var(--ink-soft)", fontSize: 12, textTransform: "uppercase", fontWeight: 800 }}>{label}</div>
      <div className="display" style={{ fontSize: 42, marginTop: 8, lineHeight: 1 }}>{value}</div>
    </article>
  );
}
