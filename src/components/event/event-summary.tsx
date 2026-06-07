import type { Event } from "@/types/domain";

export function EventSummary({ event }: { event: Event }) {
  return (
    <section className="card" style={{ padding: 24 }}>
      <span className="pill">evento {event.visibility === "private" ? "privado" : "público"}</span>
      <h1 style={{ margin: "18px 0 8px", fontSize: "clamp(42px, 8vw, 92px)", lineHeight: 0.92 }}>
        {event.title}
      </h1>
      <p style={{ color: "var(--ink-soft)", fontSize: 18, lineHeight: 1.55, maxWidth: 680 }}>
        Convite, mural ao vivo e cápsula digital por {event.plan.retentionMonths} meses. Tema:{" "}
        <strong>{event.theme}</strong>.
      </p>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", marginTop: 24 }}>
        <Info label="Quando" value={`${event.date} - ${event.startsAt} as ${event.endsAt}`} />
        <Info label="Onde" value={`${event.venueName}, ${event.city}`} />
        <Info label="Plano" value={`${event.plan.label} - ${event.plan.storageGb} GB`} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <div style={{ color: "var(--ink-soft)", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
