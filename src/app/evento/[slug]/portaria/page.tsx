import { notFound } from "next/navigation";
import { PrototypePortariaView } from "@/components/app/guest/prototype-portaria-view";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import { formatEventDateLine } from "@/lib/events/format-event-date";

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
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--paper)" }}>
        <div className="card" style={{ maxWidth: 420, padding: 28, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h1 className="serif-i" style={{ fontSize: 24, margin: "0 0 8px" }}>
            Link de check-in inválido
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
            Peça ao organizador o link correto da portaria.
          </p>
        </div>
      </div>
    );
  }

  const rsvps = await safeRepositoryCall(
    () => repositories.guestRsvps.listByEvent(event.id),
    [],
    "guestRsvps.listByEvent"
  );

  return (
    <PrototypePortariaView
      event={event}
      token={token}
      initialRsvps={rsvps}
      subtitle={[event.hostName, formatEventDateLine(event.date), event.startsAt?.slice(0, 5)].filter(Boolean).join(" · ")}
    />
  );
}
