"use client";

import { useState } from "react";
import { RETENTION_CAPSULE_DESCRIPTION } from "@/lib/copy/retention";

type PanelMode = "live" | "memory";
type FormMode = "code" | "login" | "request";

export function MuralAccessPanel({
  eventId,
  capsuleActive,
  mode
}: {
  eventId: string;
  capsuleActive: boolean;
  mode: PanelMode;
}) {
  const [formMode, setFormMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!capsuleActive) return null;

  const isMemory = mode === "memory";
  const title = isMemory ? "Cápsula do tempo" : "Mural ao vivo";
  const intro = isMemory
    ? "Este evento virou uma cápsula do tempo. Informe o e-mail usado na confirmação de presença e o código enviado para ver fotos, vídeos e recados."
    : "Entre no mural ao vivo com o e-mail da confirmação de presença. Se ainda não confirmou, solicite acesso ao organizador.";

  async function requestCode() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/events/${eventId}/mural/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o código.");
        return;
      }
      setMessage(data.message ?? "Código enviado para seu e-mail.");
      setFormMode("login");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setPending(false);
    }
  }

  async function login() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/mural/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setPending(false);
    }
  }

  async function requestAccess() {
    setPending(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/events/${eventId}/mural/access-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestFirstName: firstName.trim(),
          guestLastName: lastName.trim(),
          guestEmail: email.trim(),
          phone: phone.trim() || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar a solicitação.");
        return;
      }
      setMessage("Solicitação enviada. Aguarde a aprovação do organizador — você receberá o código por e-mail.");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="public-event-card public-mural-access">
      <h2 className="public-event-section-title">{title}</h2>
      <p className="public-event-message">{intro}</p>
      {isMemory ? (
        <p className="public-event-message public-event-retention-note">{RETENTION_CAPSULE_DESCRIPTION}</p>
      ) : null}

      <div className="public-mural-access-tabs">
        <button type="button" className={formMode === "login" ? "is-active" : ""} onClick={() => setFormMode("login")}>
          Entrar
        </button>
        <button type="button" className={formMode === "code" ? "is-active" : ""} onClick={() => setFormMode("code")}>
          Receber código
        </button>
        {!isMemory ? (
          <button type="button" className={formMode === "request" ? "is-active" : ""} onClick={() => setFormMode("request")}>
            Solicitar acesso
          </button>
        ) : (
          <button type="button" className={formMode === "request" ? "is-active" : ""} onClick={() => setFormMode("request")}>
            Perdi o acesso
          </button>
        )}
      </div>

      {formMode === "request" ? (
        <div className="praesentia-form praesentia-form-stack">
          <label className="field">
            <span>Nome completo *</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" />
          </label>
          <label className="field">
            <span>Sobrenome *</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" />
          </label>
          <label className="field">
            <span>E-mail *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="field">
            <span>WhatsApp *</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </label>
          <button type="button" className="btn" disabled={pending} onClick={requestAccess}>
            {isMemory ? "Solicitar novo acesso" : "Enviar solicitação ao organizador"}
          </button>
        </div>
      ) : (
        <div className="praesentia-form praesentia-form-stack">
          <label className="field">
            <span>E-mail usado na confirmação *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {formMode === "login" ? (
            <label className="field">
              <span>Código de acesso *</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 dígitos" maxLength={6} />
            </label>
          ) : null}
          <button
            type="button"
            className="btn"
            disabled={pending || !email.trim() || (formMode === "login" && !code.trim())}
            onClick={formMode === "login" ? login : requestCode}
          >
            {pending ? "Aguarde..." : formMode === "login" ? `Entrar na ${isMemory ? "cápsula" : "mural"}` : "Enviar código por e-mail"}
          </button>
        </div>
      )}

      {error ? <p className="public-rsvp-error">{error}</p> : null}
      {message ? <p className="settings-status is-ok">{message}</p> : null}
    </article>
  );
}
