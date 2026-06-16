"use client";

import { useState } from "react";
import type { GuestMessage } from "@/types/domain";
import { Avatar } from "@/components/app/ui/primitives";
import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";

const AVATAR_COLORS = ["#E7C9B9", "#C6D4E2", "#CCE0CE", "#D9CEE8", "#F3D7BC"];

export function GuestMessageSection({
  eventId,
  initialPublicMessages = [],
  variant = "default"
}: {
  eventId: string;
  initialPublicMessages?: GuestMessage[];
  variant?: "default" | "prototype";
}) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [publicMessages, setPublicMessages] = useState(initialPublicMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function sendMessage() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/guest-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: authorName.trim(),
          body: body.trim(),
          visibility
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o recado.");
        return;
      }
      if (visibility === "public" && data.message) {
        setPublicMessages((current) => [data.message as GuestMessage, ...current]);
      }
      setBody("");
      setSent(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  if (variant === "prototype") {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <Icon name="msg" size={18} style={{ color: "var(--coral-deep)" }} />
          <strong style={{ fontSize: 14.5 }}>Recados</strong>
          <span className="mono" style={{ marginLeft: "auto", fontSize: 9 }}>
            público
          </span>
        </div>
        {publicMessages.map((message, i) => (
          <div key={message.id} style={{ display: "flex", gap: 10, marginBottom: 13 }}>
            <Avatar name={message.authorName} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} size={30} />
            <div style={{ flex: 1, background: "var(--card-2)", borderRadius: "4px 14px 14px 14px", padding: "9px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{message.authorName}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{message.body}</div>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexDirection: "column" }}>
          <input
            className="input"
            placeholder="Seu nome"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Deixe um carinho…"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              style={{ padding: "10px 12px" }}
            />
            <button type="button" className="btn btn-coral btn-sm" style={{ padding: "0 14px" }} disabled={pending || !body.trim() || !authorName.trim()} onClick={sendMessage}>
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 12, marginTop: 8 }}>{error}</p> : null}
      </>
    );
  }

  return (
    <article className="public-event-card public-guest-messages">
      <h2 className="public-event-section-title">Enviar um recado</h2>
      <p className="public-event-message">
        Deixe uma mensagem de carinho para o organizador ou para todos os convidados que visitarem este link.
      </p>

      <div className="public-message-visibility" role="tablist" aria-label="Visibilidade do recado">
        <button
          type="button"
          role="tab"
          aria-selected={visibility === "public"}
          className={visibility === "public" ? "is-active" : ""}
          onClick={() => setVisibility("public")}
        >
          <span className="public-message-visibility-label">Público</span>
          <span className="public-message-visibility-desc">Visível para quem abrir o link</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={visibility === "private"}
          className={visibility === "private" ? "is-active" : ""}
          onClick={() => setVisibility("private")}
        >
          <span className="public-message-visibility-label">Privado</span>
          <span className="public-message-visibility-desc">Somente o organizador lê</span>
        </button>
      </div>

      <div className="praesentia-form praesentia-form-stack">
        <label className="field">
          <span>Seu nome *</span>
          <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={120} placeholder="Como quer ser identificado(a)" />
        </label>
        <label className="field">
          <span>Mensagem * (máx. 500 caracteres)</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 500))}
            maxLength={500}
            rows={4}
            placeholder="Escreva seu recado aqui..."
          />
        </label>
        <p className="cover-field-help">{body.length}/500</p>
        {error ? <p className="public-rsvp-error">{error}</p> : null}
        {sent ? <p className="settings-status is-ok">Recado enviado com sucesso.</p> : null}
        <button
          type="button"
          className="btn public-rsvp-action"
          disabled={pending || !authorName.trim() || !body.trim()}
          onClick={sendMessage}
        >
          {pending ? "Enviando..." : visibility === "private" ? "Enviar recado privado" : "Enviar recado público"}
        </button>
      </div>

      {publicMessages.length ? (
        <div className="public-message-feed">
          <h3 className="public-event-section-title public-message-feed-title">Recados públicos</h3>
          <ul>
            {publicMessages.map((message) => (
              <li key={message.id} className="public-message-item">
                <strong>{message.authorName}</strong>
                <p>{message.body}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
