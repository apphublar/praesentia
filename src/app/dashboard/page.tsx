import Link from "next/link";
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
    <main className="dashboard-main">
      <section className="dashboard-page-header">
        <p className="dashboard-event-greeting">Olá, {session.user.name}</p>
        <h1 className="display-i dashboard-page-title">Meus eventos</h1>
        <p className="dashboard-page-lead">
          Escolha um evento para gerenciar convite, convidados e cápsula — tudo em um só lugar.
        </p>
        <Link className="btn" href="/criar">
          + Criar novo evento
        </Link>
      </section>

      {events.length === 0 ? (
        <section className="card dashboard-card dashboard-empty">
          <h2 className="display" style={{ fontSize: 28, margin: 0 }}>
            Nenhum evento criado ainda
          </h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Crie seu primeiro convite ou vaquinha. Depois você personaliza tudo no painel do evento.
          </p>
          <Link className="btn" href="/criar">
            Criar evento grátis
          </Link>
        </section>
      ) : (
        <div className="dashboard-events-grid">
          {events.map((event) => (
            <Link key={event.id} href={`/dashboard/eventos/${event.id}`} className="dashboard-event-card">
              <div className="dashboard-event-card-cover">
                {event.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.coverImageUrl} alt="" />
                ) : (
                  <span>{event.theme}</span>
                )}
              </div>
              <div className="dashboard-event-card-body">
                <strong>{event.title}</strong>
                <p>
                  {EVENT_TYPE_LABELS[event.eventType]} · {event.plan.label}
                </p>
                <span className="pill">{event.phase}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
