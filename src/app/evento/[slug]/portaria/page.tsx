import { notFound } from "next/navigation";
import { PortariaPanel } from "@/components/event/portaria-panel";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";

export default async function PortariaPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};
  const token = typeof sp.token === "string" ? sp.token : null;

  const event = await repositories.events.findBySlugOrCode(slug);
  if (!event) notFound();

  if (!token || token !== event.freeCode) {
    return (
      <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 24 }}>
        <section style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, padding: 32, maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 28, margin: "0 0 12px" }}>Acesso restrito</h1>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Este link de check-in é inválido ou expirado. Peça ao organizador do evento o link correto.
          </p>
        </section>
      </main>
    );
  }

  const rsvps = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id),
    [],
    "guestRsvps.listByEvent"
  );

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)" }}>
            check-in dos convidados
          </span>
          <h1 style={{ fontFamily: "DM Serif Display, serif", fontSize: 32, margin: "6px 0 4px", lineHeight: 1.1 }}>
            {event.title}
          </h1>
          <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{event.hostName}</p>
        </div>

        <PortariaPanel eventId={event.id} token={token} initialRsvps={rsvps} />
      </div>
    </main>
  );
}
