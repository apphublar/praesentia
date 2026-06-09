import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";

export default async function DashboardPage() {
  const session = await requirePageSession("/dashboard");
  const events = await repositories.events.listByOwner(session.user.id);

  if (events.length === 1) {
    const { redirect } = await import("next/navigation");
    redirect(`/dashboard/eventos/${events[0].id}`);
  }

  return (
    <>
      <AppNav />
      <main className="shell paper dashboard-main" style={{ padding: "42px 0 90px" }}>
        <span className="pill">painel do responsável</span>
        <h1 className="display-i" style={{ fontSize: "clamp(48px, 7vw, 86px)", lineHeight: 0.94, margin: "14px 0 24px" }}>
          Seus eventos
        </h1>
        {events.length === 0 ? (
          <section className="card dashboard-card" style={{ maxWidth: 680 }}>
            <h2 className="display" style={{ fontSize: 28, margin: 0 }}>Nenhum evento criado ainda.</h2>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
              Crie seu primeiro convite ou vaquinha. Depois você gerencia tudo no painel do evento.
            </p>
            <Link className="btn" href="/criar">Criar evento</Link>
          </section>
        ) : (
          <div className="dashboard-stack">
            {events.map((event) => (
              <Link key={event.id} href={`/dashboard/eventos/${event.id}`} className="card dashboard-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="polaroid" style={{ width: 96, padding: 6, paddingBottom: 16, transform: "rotate(-3deg)", flexShrink: 0 }}>
                    <div className="placeholder" style={{ height: 78, backgroundColor: "#f1d8c9" }}>{event.theme}</div>
                  </div>
                  <div style={{ flex: "1 1 260px" }}>
                    <strong className="display" style={{ fontSize: 26 }}>{event.title}</strong>
                    <p style={{ color: "var(--ink-soft)", margin: "6px 0 0" }}>
                      {EVENT_TYPE_LABELS[event.eventType]} · {event.plan.label}
                    </p>
                  </div>
                  <span className="pill" style={{ marginLeft: "auto" }}>{event.phase}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
