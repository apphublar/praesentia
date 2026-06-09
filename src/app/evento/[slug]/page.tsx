import { notFound } from "next/navigation";
import Image from "next/image";
import { EventExperience } from "@/components/event/event-experience";
import { RsvpForm } from "@/components/event/rsvp-form";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { hasCapsuleAccess } from "@/lib/plans/features";

function WhatsAppShare({ event }: { event: { slug: string; title: string } }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const link = `${appUrl}/evento/${event.slug}`;
  const text = encodeURIComponent(`Você está convidado(a) para ${event.title}! Confirme sua presença: ${link}`);
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

  const media = hasCapsuleAccess(event) ? await repositories.media.listPublishedByEvent(event.id) : [];
  const session = await getCurrentSession();
  const membership = session ? await repositories.members.findMembership(event.id, session.user.id) : null;
  const isManager = membership?.role === "owner" || membership?.role === "manager";
  const capsuleActive = hasCapsuleAccess(event);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const eventLink = `${appUrl}/evento/${event.slug}`;

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "42px 0 90px", maxWidth: 720 }}>

        {event.coverImageUrl && (
          <div style={{ marginBottom: 32, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(27,18,9,.12)" }}>
            <Image
              src={event.coverImageUrl}
              alt={`Convite de ${event.title}`}
              width={720}
              height={1280}
              unoptimized={event.coverImageUrl.startsWith("data:")}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <span className="pill">{capsuleActive ? (event.phase === "live" ? "ao vivo" : "cápsula") : "convite gratuito"}</span>
          <h1 className="display-i" style={{ fontSize: "clamp(42px,7vw,80px)", lineHeight: 0.94, margin: "12px 0 8px" }}>{event.title}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
            {new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}{event.startsAt}–{event.endsAt}
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{locationLine(event)}</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
          <WhatsAppShare event={event} />
          {isManager && (
            <a href={`/dashboard/eventos/${event.id}`} className="btn secondary">Painel do evento</a>
          )}
        </div>

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>Link para convidados:</p>
          <code style={{ background: "var(--bg-soft)", padding: "8px 12px", borderRadius: 8, fontSize: 13, wordBreak: "break-all", display: "block" }}>{eventLink}</code>
        </div>

        <RsvpForm eventId={event.id} eventTitle={event.title} capsuleAvailable={capsuleActive} />

        {capsuleActive ? (
          <div style={{ marginTop: 48 }}>
            <EventExperience event={event} media={media} currentUserId={session?.user.id} />
          </div>
        ) : (
          <article className="card" style={{ padding: 24, marginTop: 48 }}>
            <span className="pill">plano gratuito</span>
            <h2 className="display" style={{ fontSize: 26, margin: "12px 0 8px" }}>Convite e confirmação de presença</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Este evento está no plano gratuito: convite, RSVP e lista de presença para o organizador.
              O mural ao vivo e a cápsula do tempo serão liberados quando o responsável ativar a Cápsula (R$59) no painel.
            </p>
          </article>
        )}
      </main>
    </>
  );
}
