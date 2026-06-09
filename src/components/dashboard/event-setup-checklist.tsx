import Link from "next/link";
import type { Event } from "@/types/domain";
import type { EventProfile } from "@/lib/events/event-profile";
import { IconCheck } from "@/components/dashboard/dashboard-icons";

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
  hidden?: boolean;
};

export function EventSetupChecklist({
  event,
  profile,
  capsuleActive,
  guestCount
}: {
  event: Event;
  profile: EventProfile;
  capsuleActive: boolean;
  guestCount: number;
}) {
  const eventBase = `/dashboard/eventos/${event.id}`;
  const hasText = Boolean(event.inviteCopy?.headline?.trim() || event.inviteCopy?.message?.trim());
  const hasCover = Boolean(event.coverImageUrl);
  const hasSchedule = Boolean(event.date && event.startsAt);
  const hasLocation = profile.isFundraising || event.eventFormat === "online" ? true : Boolean(event.venueName && event.city);
  const hasPix = !profile.needsPix || Boolean(event.pix?.enabled && event.pix.key);

  const items: ChecklistItem[] = [
    {
      id: "texto",
      title: profile.isFundraising ? "Escreva a história da vaquinha" : "Escreva o texto do convite",
      description: "Personalize a mensagem que seus convidados vão receber.",
      done: hasText,
      href: `${eventBase}#secao-texto`,
      action: "Editar"
    },
    {
      id: "capa",
      title: "Crie a capa do convite",
      description: "Use a IA ou envie uma imagem personalizada.",
      done: hasCover,
      href: `${eventBase}#secao-capa`,
      action: "Alterar"
    },
    {
      id: "dados",
      title: profile.isFundraising ? "Revise meta e prazo" : "Confira data, horário e local",
      description: profile.isFundraising
        ? "Deixe claro o objetivo e o prazo da arrecadação."
        : "Mantenha endereço e horários sempre atualizados.",
      done: hasSchedule && hasLocation,
      href: `${eventBase}#secao-configuracoes`,
      action: "Gerenciar"
    },
    {
      id: "pix",
      title: "Configure o Pix",
      description: "Receba contribuições direto na sua chave.",
      done: hasPix,
      href: `${eventBase}#secao-configuracoes`,
      action: "Editar",
      hidden: !profile.needsPix
    },
    {
      id: "rsvp",
      title: "Organize os convidados",
      description: guestCount > 0 ? `${guestCount} confirmação(ões) recebida(s).` : "Acompanhe quem confirmou presença.",
      done: guestCount > 0,
      href: `${eventBase}#secao-rsvp`,
      action: "Ver lista",
      hidden: !profile.needsRsvp
    },
    {
      id: "compartilhar",
      title: "Compartilhe o convite",
      description: "Envie o link ou QR Code pelo WhatsApp.",
      done: hasText && hasCover,
      href: `${eventBase}#secao-compartilhar`,
      action: "Compartilhar"
    },
    {
      id: "capsula",
      title: "Ative a Cápsula Praesentia",
      description: "Mural ao vivo, telão e cápsula do tempo — exclusivo da Praesentia.",
      done: capsuleActive,
      href: `${eventBase}#secao-capsula`,
      action: capsuleActive ? "Ver plano" : "Ativar"
    }
  ].filter((item) => !item.hidden);

  const doneCount = items.filter((item) => item.done).length;

  return (
    <section className="dashboard-checklist card dashboard-card">
      <div className="dashboard-checklist-head">
        <div>
          <span className="pill">personalize seu evento</span>
          <h2 className="display" style={{ fontSize: 28, margin: "10px 0 6px" }}>
            Checklist do evento
          </h2>
          <p style={{ color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
            {doneCount} de {items.length} etapas concluídas. Complete tudo para deixar seu {profile.isFundraising ? "vaquinha" : "convite"} pronto.
          </p>
        </div>
        <Link className="btn secondary" href={`/criar/continuar/${event.id}`}>
          Assistente rápido
        </Link>
      </div>

      <ul className="dashboard-checklist-list">
        {items.map((item) => (
          <li key={item.id} className={`dashboard-checklist-item${item.done ? " is-done" : ""}`}>
            <span className={`dashboard-checklist-status${item.done ? " is-done" : ""}`} aria-hidden="true">
              {item.done ? <IconCheck /> : null}
            </span>
            <div className="dashboard-checklist-copy">
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <Link className="dashboard-checklist-btn" href={item.href}>
              {item.action}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
