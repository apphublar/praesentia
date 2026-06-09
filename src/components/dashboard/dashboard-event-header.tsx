import type { Event, User } from "@/types/domain";
import type { EventProfile } from "@/lib/events/event-profile";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";

export function DashboardEventHeader({
  user,
  event,
  profile,
  guestCount,
  mediaCount,
  capsuleActive
}: {
  user: User;
  profile: EventProfile;
  event: Event;
  guestCount: number;
  mediaCount: number;
  capsuleActive: boolean;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.praesentia.com.br";
  const publicUrl = `${appUrl}/evento/${event.slug}`;
  const firstName = user.name.split(" ")[0];

  return (
    <section className="dashboard-event-header">
      <div className="dashboard-event-header-copy">
        <p className="dashboard-event-greeting">Olá, {user.name}</p>
        <h1 className="display-i dashboard-event-title">{event.title}</h1>
        <p className="dashboard-event-url">
          Link público:{" "}
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            {publicUrl}
          </a>
        </p>
        <DashboardQuickActions eventSlug={event.slug} eventTitle={event.title} whatsappText={event.inviteCopy?.whatsapp} />
      </div>

      <div className="dashboard-event-metrics">
        <article className={`dashboard-metric-card${capsuleActive ? "" : " is-highlight"}`}>
          <span className="dashboard-metric-label">Plano</span>
          <strong className="dashboard-metric-value">{event.plan.label}</strong>
          <p className="dashboard-metric-note">
            {capsuleActive ? "Cápsula ativa neste evento" : "Gratuito — ative a cápsula quando quiser"}
          </p>
          <a className="dashboard-metric-btn" href={`#secao-capsula`}>
            {capsuleActive ? "Ver recursos" : "Ativar cápsula"}
          </a>
        </article>

        {profile.needsRsvp ? (
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Convidados (RSVP)</span>
            <strong className="dashboard-metric-value">{guestCount}</strong>
            <p className="dashboard-metric-note">Confirmações recebidas no convite</p>
            <a className="dashboard-metric-btn" href="#secao-rsvp">
              Ver convidados
            </a>
          </article>
        ) : null}

        {profile.isFundraising && event.pix?.suggestedAmount ? (
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Meta Pix</span>
            <strong className="dashboard-metric-value">R$ {event.pix.suggestedAmount.toLocaleString("pt-BR")}</strong>
            <p className="dashboard-metric-note">Vaquinha configurada para arrecadação</p>
            <a className="dashboard-metric-btn" href="#secao-configuracoes">
              Editar Pix
            </a>
          </article>
        ) : null}

        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Site do evento</span>
          <strong className="dashboard-metric-value">{profile.isFundraising ? "Vaquinha" : "Convite"}</strong>
          <p className="dashboard-metric-note">Olá, {firstName}! Compartilhe o link com quem você ama.</p>
          <a className="dashboard-metric-btn" href={`/evento/${event.slug}`} target="_blank" rel="noopener noreferrer">
            Ver meu site
          </a>
        </article>

        {capsuleActive ? (
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Mural ao vivo</span>
            <strong className="dashboard-metric-value">{mediaCount}</strong>
            <p className="dashboard-metric-note">Mídias publicadas pelos convidados</p>
            <a className="dashboard-metric-btn" href="#secao-mural">
              Gerenciar mídias
            </a>
          </article>
        ) : null}
      </div>
    </section>
  );
}
