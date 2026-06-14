"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { InviteArt } from "@/components/app/ui/invite-art";
import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";
import type { PlanId } from "@/components/app/plans/plan-cards";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { fillInviteLink } from "@/lib/openai/invite-text";

function formatTimeShort(time: string) {
  const [h, m] = time.split(":");
  return `${h}h${m === "00" ? "" : m}`;
}

function placeLabel(event: Event) {
  if (event.venueName === "Local a definir") return "Local a definir";
  if (event.eventFormat === "online") return "Evento online";
  return event.venueName;
}

export function CreateEventPronto({
  event,
  inviteCopy,
  coverUrl,
  plan
}: {
  event: Event;
  inviteCopy?: InviteCopy;
  coverUrl?: string;
  plan: PlanId;
}) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.praesentia.com.br";
  const fullLink = `${appUrl}/evento/${event.slug}`;
  const [copied, setCopied] = useState(false);

  const whatsappText = useMemo(
    () => fillInviteLink(inviteCopy?.whatsapp ?? `Você está convidado(a)! Confirme aqui: {{link}}`, fullLink),
    [inviteCopy?.whatsapp, fullLink]
  );
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
  const message = inviteCopy?.message?.trim() || event.inviteCopy?.message?.trim() || "";

  async function copyLink() {
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="create-pronto">
      <div className="create-pronto-header">
        <div
          className="pop"
          style={{
            width: 64,
            height: 64,
            borderRadius: 99,
            background: "var(--coral)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
            boxShadow: "0 12px 30px -10px rgba(242,107,90,.6)"
          }}
        >
          <Icon name="check" size={30} sw={2.6} style={{ color: "#fff" }} />
        </div>
        <h1 className="display" style={{ fontSize: 40, marginBottom: 8 }}>
          Seu evento está <span className="coral">no ar</span>.
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 15, margin: 0 }}>
          Um único link acompanha tudo — do convite {plan !== "free" ? "à cápsula do tempo" : "até o fim da festa"}.
        </p>
      </div>

      <div className="create-pronto-grid">
        <section className="create-pronto-preview">
          <Mono style={{ display: "block", marginBottom: 12 }}>Prévia do convite</Mono>
          <div className="create-pronto-preview-frame">
            <InviteArt
              title={event.title}
              themeLabel={event.theme}
              dateShort={formatEventDateLine(event.date) ?? event.date}
              time={formatTimeShort(event.startsAt)}
              place={placeLabel(event)}
              coverUrl={coverUrl || event.coverImageUrl || undefined}
              compact
              width="100%"
            />
          </div>
          {message ? (
            <div className="card-flat create-pronto-message">
              <Mono style={{ display: "block", marginBottom: 8, fontSize: 9 }}>Mensagem do convite</Mono>
              <p className="serif-i" style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>
                {message}
              </p>
            </div>
          ) : null}
        </section>

        <section className="create-pronto-share">
          <Mono style={{ display: "block", marginBottom: 12 }}>Compartilhar</Mono>
          <div className="card-flat create-pronto-link-row">
            <Icon name="link" size={16} style={{ color: "var(--muted)", flexShrink: 0 }} />
            <span className="create-pronto-link-text">{fullLink.replace(/^https?:\/\//, "")}</span>
            <button type="button" className="btn btn-dark btn-sm" onClick={copyLink}>
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <a className="btn btn-coral" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <Icon name="share" size={16} />
            Enviar no WhatsApp
          </a>
          <Link className="btn btn-ghost" href={`/evento/${event.slug}`} target="_blank">
            <Icon name="eye" size={16} />
            Ver como convidado
          </Link>
          {whatsappText !== message ? (
            <div className="card-flat create-pronto-message create-pronto-whatsapp-preview">
              <Mono style={{ display: "block", marginBottom: 8, fontSize: 9 }}>Mensagem do WhatsApp</Mono>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{whatsappText}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
