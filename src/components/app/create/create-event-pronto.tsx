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
import { buildInviteShareText, buildWhatsAppUrl, fetchImageFile, shareInviteWithImage } from "@/lib/share/invite-share";

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
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState("");

  const message = inviteCopy?.message?.trim() || event.inviteCopy?.message?.trim() || "";
  const whatsappTemplate = inviteCopy?.whatsapp ?? event.inviteCopy?.whatsapp;
  const shareText = useMemo(
    () => buildInviteShareText(message, whatsappTemplate, fullLink),
    [message, whatsappTemplate, fullLink]
  );
  const whatsapp = buildWhatsAppUrl(shareText);
  const resolvedCover = coverUrl || event.coverImageUrl || undefined;

  async function copyAll() {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleWhatsAppShare() {
    setSharing(true);
    setShareNote("");
    try {
      const shared = await shareInviteWithImage({ text: shareText, coverUrl: resolvedCover, filename: `convite-${event.slug}.jpg` });
      if (shared) return;
      window.open(whatsapp, "_blank", "noopener,noreferrer");
      if (resolvedCover) {
        setShareNote("Abra o WhatsApp e anexe a imagem do convite (use Baixar convite, se preferir).");
      }
    } catch {
      window.open(whatsapp, "_blank", "noopener,noreferrer");
      if (resolvedCover) {
        try {
          await fetchImageFile(resolvedCover, `convite-${event.slug}.jpg`);
          setShareNote("Se a imagem não foi anexada, baixe o convite e envie manualmente no WhatsApp.");
        } catch {
          setShareNote("Não foi possível anexar a imagem automaticamente. Use Baixar convite e envie no WhatsApp.");
        }
      }
    } finally {
      setSharing(false);
    }
  }

  async function downloadCover() {
    if (!resolvedCover) return;
    const file = await fetchImageFile(resolvedCover, `convite-${event.slug}.jpg`);
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
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
              coverUrl={resolvedCover}
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
          <div className="card-flat create-pronto-message create-pronto-share-text">
            <Mono style={{ display: "block", marginBottom: 8, fontSize: 9 }}>Texto + link</Mono>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{shareText}</p>
          </div>
          <div className="create-pronto-share-actions">
            <button type="button" className="btn btn-dark" onClick={copyAll}>
              <Icon name="link" size={16} />
              {copied ? "Copiado!" : "Copiar texto + link"}
            </button>
            <button type="button" className="btn btn-coral" disabled={sharing} onClick={() => void handleWhatsAppShare()}>
              <Icon name="share" size={16} />
              {sharing ? "Abrindo…" : "Enviar no WhatsApp"}
            </button>
            {resolvedCover ? (
              <button type="button" className="btn btn-ghost" onClick={() => void downloadCover()}>
                <Icon name="download" size={16} />
                Baixar convite
              </button>
            ) : null}
            <Link className="btn btn-ghost" href={`/evento/${event.slug}`} target="_blank">
              <Icon name="eye" size={16} />
              Ver como convidado
            </Link>
          </div>
          {shareNote ? <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.45 }}>{shareNote}</p> : null}
        </section>
      </div>
    </div>
  );
}
