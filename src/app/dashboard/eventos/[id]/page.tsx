import Link from "next/link";
import { notFound } from "next/navigation";
import { EventSettingsForms } from "@/components/dashboard/event-settings-forms";
import { CoverGenerator } from "@/components/dashboard/cover-generator";
import { OwnerMediaControls } from "@/components/event/owner-media-controls";
import { AppNav } from "@/components/layout/app-nav";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const event = await repositories.events.findById(id);
  if (!event) notFound();

  const media = await repositories.media.listPublishedByEvent(event.id);
  const eventMembers = await repositories.members.listByEvent(event.id);
  const guestRsvps = await repositories.guestRsvps.listByEvent(event.id);
  const membership = await repositories.members.findMembership(event.id, session.user.id);
  const allowed = canManageEvent(session.user, membership ?? undefined);

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "42px 0 90px" }}>
        <span className="pill">gestao do evento</span>
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
              <Link className="btn secondary" href={`/evento/${event.slug}/telao`}>
                Abrir telao
              </Link>
            </div>

            <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Metric label="Confirmados" value={String(eventMembers.filter((member) => member.rsvpStatus === "confirmed").length)} />
              <Metric label="Midias publicadas" value={String(media.length)} />
              <Metric label="Curtidas totais" value={String(media.reduce((sum, item) => sum + item.likesCount, 0))} />
              <Metric label="Armazenamento" value={`${event.storageUsedGb}/${event.plan.storageGb} GB`} />
            </section>

            <section className="grid-collapse" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }}>
              <article className="card" style={{ padding: 22 }}>
                <span className="pill">armazenamento Cloudflare</span>
                <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>{event.storageUsedGb} GB usados</h2>
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
                  Plano {event.plan.label}: {event.plan.storageGb} GB. No Familia, os 25 GB sao compartilhados entre ate 12 eventos,
                  mantendo cada capsula separada.
                </p>
                <div className="storage-actions-row">
                  {["+5 GB", "+10 GB", "+25 GB", "+50 GB"].map((item) => (
                    <button key={item} className="btn secondary" type="button">
                      {item}
                    </button>
                  ))}
                </div>
              </article>

              <article className="card" style={{ padding: 22, background: "var(--bg-soft)" }}>
                <span className="pill">estrutura</span>
                <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>Operacao privada</h2>
                <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
                  O responsavel controla Pix, publicacao do evento, acesso de convidados, conteudos arquivados e exibicao no telao.
                  O envio continua restrito a convidados confirmados com conta.
                </p>
              </article>
            </section>

            <CoverGenerator eventId={event.id} currentCoverUrl={event.coverImageUrl} />

            <article className="card" style={{ padding: 22 }}>
              <span className="pill">confirmações de presença</span>
              <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>
                {guestRsvps.length} confirmado{guestRsvps.length !== 1 ? "s" : ""}
              </h2>
              {guestRsvps.length === 0 ? (
                <p style={{ color: "var(--ink-soft)" }}>Nenhum convidado confirmou presença ainda. Compartilhe o link do evento!</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                  {guestRsvps.map((rsvp) => (
                    <div key={rsvp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                      <div>
                        <strong>{rsvp.guestName}</strong>
                        {rsvp.phone && <span style={{ color: "var(--ink-soft)", fontSize: 13, marginLeft: 10 }}>{rsvp.phone}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {rsvp.wantsCapsule && <span className="pill" style={{ background: "var(--green)", color: "#fff", fontSize: 11 }}>cápsula</span>}
                        <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>
                          {new Date(rsvp.confirmedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <EventSettingsForms event={event} members={eventMembers} />
            <OwnerMediaControls items={media} />
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
