import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { VaquinhaPublicView } from "@/components/event/vaquinha-public-view";
import { RsvpForm } from "@/components/event/rsvp-form";
import { EventExperience } from "@/components/event/event-experience";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";
import { canUploadVideo } from "@/lib/auth/permissions";
import { getEventProfile } from "@/lib/events/event-profile";
import { repositories } from "@/lib/db";
import { hasCapsuleAccess } from "@/lib/plans/features";

function WhatsAppShare({ event, message }: { event: { slug: string; title: string }; message?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const link = `${appUrl}/evento/${event.slug}`;
  const text = encodeURIComponent(message ?? `Você está convidado(a) para ${event.title}! Confirme aqui: ${link}`);
  const waUrl = `https://wa.me/?text=${text}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn"
      style={{ background: "#25D366", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
    >
      Compartilhar no WhatsApp
    </a>
  );
}

function locationLine(event: { eventFormat: string; venueName: string; city: string; onlineMeetingUrl?: string }) {
  if (event.eventFormat === "fundraising") {
    return "Vaquinha online · contribuição via Pix";
  }
  if (event.eventFormat === "online") {
    return event.onlineMeetingUrl ? (
      <a href={event.onlineMeetingUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--coral)" }}>
        Acessar evento online
      </a>
    ) : (
      "Evento online"
    );
  }
  return `${event.venueName} · ${event.city}`;
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  const profile = getEventProfile(event.eventType);
  const isFundraising = profile.isFundraising || event.eventFormat === "fundraising";
  const capsuleActive = hasCapsuleAccess(event);
  const media = capsuleActive ? await repositories.media.listPublishedByEvent(event.id) : [];
  const session = await getCurrentSession();
  const membership = session ? await repositories.members.findMembership(event.id, session.user.id) : null;
  const canUploadVideoAsManager = session ? canUploadVideo(session.user, membership ?? undefined) : false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const eventLink = `${appUrl}/evento/${event.slug}`;
  const deadlineLabel = event.date
    ? new Date(`${event.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : undefined;

  const whatsappShareText = event.inviteCopy?.whatsapp?.includes("{{link}}")
    ? event.inviteCopy.whatsapp.replace(/\{\{link\}\}/g, eventLink)
    : event.inviteCopy?.whatsapp;

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "42px 0 90px", maxWidth: 720 }}>
        {event.coverImageUrl && (
          <div style={{ marginBottom: 32, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(27,18,9,.12)" }}>
            <Image
              src={event.coverImageUrl}
              alt={isFundraising ? `Vaquinha ${event.title}` : `Convite de ${event.title}`}
              width={720}
              height={1280}
              unoptimized={event.coverImageUrl.startsWith("data:")}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        )}

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
            eventLink={eventLink}
          />
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <span className="pill">{capsuleActive ? (event.phase === "live" ? "ao vivo" : "cápsula") : "convite gratuito"}</span>
              <h1 className="display-i" style={{ fontSize: "clamp(42px,7vw,80px)", lineHeight: 0.94, margin: "12px 0 8px" }}>{event.title}</h1>
              <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
                {new Date(`${event.date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                {" · "}{event.startsAt}–{event.endsAt}
              </p>
              <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{locationLine(event)}</p>
              {event.inviteCopy && (
                <div style={{ marginTop: 20 }}>
                  {event.inviteCopy.headline && (
                    <p className="display" style={{ fontSize: 22, margin: "0 0 10px" }}>{event.inviteCopy.headline}</p>
                  )}
                  <p style={{ color: "var(--ink-soft)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{event.inviteCopy.message}</p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
              <WhatsAppShare event={event} message={whatsappShareText} />
              {canUploadVideoAsManager && (
                <Link className="btn secondary" href={`/dashboard/eventos/${event.id}`}>Painel do evento</Link>
              )}
            </div>

            <div style={{ marginBottom: 36 }}>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>Link para convidados:</p>
              <code style={{ background: "var(--bg-soft)", padding: "8px 12px", borderRadius: 8, fontSize: 13, wordBreak: "break-all", display: "block" }}>{eventLink}</code>
            </div>

            {profile.needsRsvp && (
              <RsvpForm eventId={event.id} eventTitle={event.title} capsuleAvailable={capsuleActive} />
            )}
          </>
        )}

        {capsuleActive ? (
          <div style={{ marginTop: 48 }}>
            <EventExperience event={event} media={media} currentUserId={session?.user.id} canUploadVideo={canUploadVideoAsManager} />
          </div>
        ) : !isFundraising ? (
          <article className="card dashboard-card" style={{ marginTop: 48 }}>
            <span className="pill">plano gratuito</span>
            <h2 className="display" style={{ fontSize: 26, margin: "12px 0 8px" }}>Convite e confirmação de presença</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Este evento está no plano gratuito. Mural ao vivo, telão e cápsula do tempo aparecem aqui somente após o responsável ativar a Cápsula (R$59).
            </p>
          </article>
        ) : null}
      </main>
    </>
  );
}
