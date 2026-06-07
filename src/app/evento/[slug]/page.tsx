import { notFound } from "next/navigation";
import Image from "next/image";
import { EventExperience } from "@/components/event/event-experience";
import { RsvpForm } from "@/components/event/rsvp-form";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";

function WhatsAppShare({ event }: { event: { slug: string; title: string; freeCode?: string } }) {
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      Compartilhar no WhatsApp
    </a>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  const media = await repositories.media.listPublishedByEvent(event.id);
  const session = await getCurrentSession();
  const isOwner = session?.user.id != null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const eventLink = `${appUrl}/evento/${event.slug}`;

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "42px 0 90px", maxWidth: 720 }}>

        {event.coverImageUrl && (
          <div style={{ marginBottom: 32, borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 32px rgba(27,18,9,.12)" }}>
            <Image src={event.coverImageUrl} alt={`Convite de ${event.title}`} width={720} height={1280} style={{ width: "100%", height: "auto", display: "block" }} />
          </div>
        )}

        <div style={{ marginBottom: 28 }}>
          <span className="pill">{event.phase === "before" ? "em breve" : event.phase === "live" ? "ao vivo" : "memória"}</span>
          <h1 className="display-i" style={{ fontSize: "clamp(42px,7vw,80px)", lineHeight: 0.94, margin: "12px 0 8px" }}>{event.title}</h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>
            {new Date(event.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}{event.startsAt}–{event.endsAt}
          </p>
          <p style={{ color: "var(--ink-soft)", fontSize: 15 }}>{event.venueName} · {event.city}</p>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
          <WhatsAppShare event={event} />
          {isOwner && (
            <a href={`/dashboard/eventos/${event.id}`} className="btn secondary">Painel do evento</a>
          )}
        </div>

        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>Link para convidados:</p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ background: "var(--bg-soft)", padding: "8px 12px", borderRadius: 8, fontSize: 13, wordBreak: "break-all" }}>{eventLink}</code>
          </div>
        </div>

        <RsvpForm eventId={event.id} eventTitle={event.title} />

        <div style={{ marginTop: 48 }}>
          <EventExperience event={event} media={media} currentUserId={session?.user.id} />
        </div>
      </main>
    </>
  );
}
