"use client";

import { useState } from "react";
import type { GuestMessage } from "@/types/domain";

export function GuestMessageSection({
  eventId,
  initialPublicMessages = []
}: {
  eventId: string;
  initialPublicMessages?: GuestMessage[];
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

  return (
    <article className="public-event-card public-guest-messages">
      <h2 className="public-event-section-title">Enviar um recado</h2>
      <p className="public-event-message">
        Deixe uma mensagem de carinho ou explique por que não poderá ir. Escolha se o recado fica visível para todos ou
        somente para o organizador.
      </p>

      <div className="public-message-visibility">
        <label className={`public-message-visibility-option${visibility === "public" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="messageVisibility"
            checked={visibility === "public"}
            onChange={() => setVisibility("public")}
          />
          <strong>Público</strong>
          <span>Todos que abrirem o link poderão ler.</span>
        </label>
        <label className={`public-message-visibility-option${visibility === "private" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="messageVisibility"
            checked={visibility === "private"}
            onChange={() => setVisibility("private")}
          />
          <strong>Privado</strong>
          <span>Somente o organizador do evento verá.</span>
        </label>
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
          <h3 className="public-event-section-title" style={{ fontSize: 18 }}>Recados públicos</h3>
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
