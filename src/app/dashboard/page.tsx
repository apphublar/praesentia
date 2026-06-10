import Link from "next/link";
import { requirePageSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { hasCapsuleAccess } from "@/lib/plans/features";

export default async function DashboardPage() {
  const session = await requirePageSession("/dashboard");
  const events = await repositories.events.listByOwner(session.user.id);
  const capsuleCount = events.filter((event) => hasCapsuleAccess(event)).length;

  return (
    <main className="dashboard-main">
      <section className="dashboard-page-header">
        <p className="dashboard-event-greeting">Olá, {session.user.name}</p>
        <h1 className="display-i dashboard-page-title">Meus eventos</h1>
        <p className="dashboard-page-lead">
          Escolha um evento na lista ou no menu lateral para gerenciar convite, convidados e cápsula.
        </p>
        <Link className="btn" href="/dashboard/criar">
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
          <Link className="btn" href="/dashboard/criar">
            Criar evento grátis
          </Link>
        </section>
      ) : (
        <>
          <section className="dashboard-event-metrics" style={{ marginBottom: 24 }}>
            <article className="dashboard-metric-card is-highlight">
              <span className="dashboard-metric-label">Eventos</span>
              <strong className="dashboard-metric-value">{events.length}</strong>
              <p className="dashboard-metric-note">Clique em um evento para abrir o painel completo.</p>
            </article>
            <article className="dashboard-metric-card">
              <span className="dashboard-metric-label">Cápsulas ativas</span>
              <strong className="dashboard-metric-value">{capsuleCount}</strong>
              <p className="dashboard-metric-note">Mural, telão e cápsula do tempo liberados.</p>
            </article>
            <article className="dashboard-metric-card">
              <span className="dashboard-metric-label">Próximo passo</span>
              <strong className="dashboard-metric-value">Convite</strong>
              <p className="dashboard-metric-note">Personalize texto, capa e compartilhe com convidados.</p>
              <Link className="dashboard-metric-btn" href={`/dashboard/eventos/${events[0].id}`}>
                Abrir {events[0].title}
              </Link>
            </article>
          </section>

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
        </>
      )}
    </main>
  );
}
