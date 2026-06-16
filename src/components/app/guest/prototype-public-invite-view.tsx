"use client";

import { useState } from "react";
import type { Event, GuestMessage } from "@/types/domain";
import { InviteArt } from "@/components/app/ui/invite-art";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Confetti, Mono, Segmented } from "@/components/app/ui/primitives";
import { Countdown } from "@/components/app/ui/countdown";
import { RsvpForm } from "@/components/event/rsvp-form";
import { formatEventDateLong } from "@/lib/events/format-event-date";
import { parseEventDateTime } from "@/lib/events/datetime";
import type { PublicInvitePhase } from "@/lib/mural/timeline";
import { GuestMessageSection } from "@/components/event/guest-message-section";
import { PraesentiaBrandFooter } from "@/components/brand/praesentia-logo";
import { GiftSuggestionsCarousel } from "@/components/event/gift-suggestions-carousel";
import { MavieInviteArt } from "@/components/marketing/mavie-invite-art";
import { isDemoEventSlug } from "@/lib/marketing/demo-event";

function FakeQr() {
  return (
    <div
      style={{
        width: 88,
        height: 88,
        flexShrink: 0,
        borderRadius: 12,
        background: "#fff",
        border: "1px solid var(--line)",
        display: "grid",
        gridTemplateColumns: "repeat(6,1fr)",
        gridTemplateRows: "repeat(6,1fr)",
        gap: 2,
        padding: 9
      }}
    >
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          style={{
            borderRadius: 1,
            background:
              [0, 1, 5, 6, 11, 12, 30, 31, 35, 18, 24, 8, 9, 15, 21, 27, 16, 22].includes(i) || (i * 5 + 2) % 3 === 0
                ? "var(--ink)"
                : "transparent"
          }}
        />
      ))}
    </div>
  );
}

export function PrototypePublicInviteView({
  event,
  invitePhase,
  capsuleActive,
  managerHref,
  publicMessages = []
}: {
  event: Event;
  invitePhase: PublicInvitePhase;
  capsuleActive: boolean;
  managerHref?: string;
  publicMessages?: GuestMessage[];
}) {
  const [pixOpen, setPixOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const showRsvp = invitePhase === "rsvp_open";
  const showCountdown = invitePhase === "countdown";
  const previewPhase = showCountdown ? "contagem" : "aberto";
  const [demoPhase, setDemoPhase] = useState<"aberto" | "contagem">(previewPhase);

  const dateLine = formatEventDateLong(event.date) ?? event.date;
  const timeLine = event.startsAt?.slice(0, 5).replace(":", "h") ?? "";
  const placeLine = event.venueName === "Local a definir" ? "Local a definir" : event.venueName;
  const cityLine = event.city;
  const host = event.organizerName ?? event.hostName;

  const countdownTarget =
    parseEventDateTime(event.date, event.startsAt)?.toISOString() ?? new Date().toISOString();

  return (
    <div className="scroll prototype-guest-scroll" style={{ height: "100%", overflow: "auto", background: "var(--paper)" }}>
      {managerHref ? (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 5,
            padding: "10px 14px",
            background: "rgba(244,237,223,.86)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Segmented
            options={[
              { v: "aberto" as const, l: "Convite" },
              { v: "contagem" as const, l: "RSVP encerrado" }
            ]}
            value={demoPhase}
            onChange={setDemoPhase}
          />
        </div>
      ) : null}

      <div style={{ padding: "14px 16px 40px" }}>
        <div className="pop">
          {isDemoEventSlug(event.slug) ? (
            <MavieInviteArt />
          ) : event.coverImageUrl ? (
            <InviteArt title={event.title} coverUrl={event.coverImageUrl} info={false} />
          ) : (
            <InviteArt title={event.title} themeLabel={event.theme} dateShort={dateLine} time={timeLine} place={placeLine} />
          )}
        </div>

        <div style={{ textAlign: "center", margin: "20px 0 4px" }}>
          <span className="pill" style={{ borderColor: "var(--line-2)" }}>
            <span className="dot" />
            Você está convidado
          </span>
        </div>
        <h1 className="serif-i" style={{ textAlign: "center", fontSize: 30, fontWeight: 600, margin: "8px 0 4px" }}>
          {event.title}
        </h1>
        <p style={{ textAlign: "center", margin: 0, color: "var(--muted)", fontSize: 13.5 }}>por {host}</p>

        {event.inviteCopy?.message ? (
          <p style={{ textAlign: "center", margin: "16px 0 0", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, whiteSpace: "pre-line" }}>
            {event.inviteCopy.message}
          </p>
        ) : null}

        <div className="card" style={{ padding: 0, overflow: "hidden", margin: "20px 0" }}>
          {[
            ["calendar", dateLine, new Date(event.date).toLocaleDateString("pt-BR", { weekday: "long" })],
            ["clock", timeLine, "horário"],
            ["pin", placeLine, cityLine]
          ].map(([ic, a, b], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 13,
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: i < 2 ? "1px solid var(--line)" : "none"
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "var(--card-2)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--coral-deep)"
                }}
              >
                <Icon name={ic as "calendar"} size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{a as string}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{b as string}</div>
              </div>
            </div>
          ))}
        </div>

        {(managerHref ? demoPhase : previewPhase) === "aberto" && showRsvp ? (
          <div className="card" style={{ padding: 20, marginBottom: 18, position: "relative", overflow: "hidden", border: "1.5px solid var(--coral)" }}>
            <Confetti style={{ opacity: 0.35 }} />
            {event.rsvpDeadline ? (
              <Mono style={{ position: "relative", color: "var(--coral-deep)" }}>
                Confirme até {formatEventDateLong(event.rsvpDeadline)}
              </Mono>
            ) : null}
            <h3 className="serif-i" style={{ fontSize: 22, margin: "7px 0 16px", position: "relative" }}>
              Você vai?
            </h3>
            <div style={{ position: "relative" }}>
              <RsvpForm eventId={event.id} eventSlug={event.slug} eventTitle={event.title} rsvpDeadline={event.rsvpDeadline} capsuleAvailable={capsuleActive} variant="prototype" />
            </div>
          </div>
        ) : null}

        {((managerHref ? demoPhase : previewPhase) === "contagem" || showCountdown) && !showRsvp ? (
          <div className="card" style={{ padding: "24px 18px", marginBottom: 18, textAlign: "center" }}>
            <Mono style={{ display: "block", marginBottom: 16 }}>Falta pouco para a festa</Mono>
            <Countdown target={countdownTarget} />
            <p style={{ margin: "18px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
              As confirmações foram encerradas. Nos vemos lá!
            </p>
          </div>
        ) : null}

        {event.pix?.enabled ? (
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <Icon name="qr" size={18} style={{ color: "var(--coral-deep)" }} />
              <strong style={{ fontSize: 14.5 }}>Pix</strong>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
              Sua presença já é o maior presente. Se quiser mimar, deixamos um Pix.
            </p>
            <button
              type="button"
              className={`btn btn-sm ${pixOpen ? "btn-dark" : "btn-ghost"}`}
              style={{ width: "100%" }}
              onClick={() => setPixOpen((open) => !open)}
            >
              <Icon name="qr" size={14} />
              {pixOpen ? "Ocultar Pix" : "Ver chave Pix"}
            </button>

            {pixOpen && event.pix ? (
              <div style={{ marginTop: 14, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <FakeQr />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Mono style={{ display: "block", marginBottom: 4 }}>Chave Pix</Mono>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 700, wordBreak: "break-all", marginBottom: 9 }}>
                      {event.pix.key}
                    </div>
                    <button
                      type="button"
                      className="btn btn-coral btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => {
                        navigator.clipboard.writeText(event.pix!.key);
                        setPixCopied(true);
                        setTimeout(() => setPixCopied(false), 1500);
                      }}
                    >
                      {pixCopied ? "Copiado!" : "Copiar chave"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {event.giftSuggestions.length > 0 ? (
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <Icon name="gift" size={18} style={{ color: "var(--coral-deep)" }} />
              <strong style={{ fontSize: 14.5 }}>Sugestões de presente</strong>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
              Ideias que a família adorou — escolha com carinho.
            </p>
            <GiftSuggestionsCarousel suggestions={event.giftSuggestions} />
          </div>
        ) : null}

        <div className="card" style={{ padding: 18 }}>
          <GuestMessageSection eventId={event.id} initialPublicMessages={publicMessages} variant="prototype" />
        </div>

        <PraesentiaBrandFooter variant="light" />

        {managerHref ? (
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 12 }}>
            <a href={managerHref} style={{ color: "var(--coral-deep)" }}>
              Painel do responsável
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
