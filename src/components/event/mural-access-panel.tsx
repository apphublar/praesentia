"use client";

import { useState } from "react";

type Mode = "code" | "login" | "request";

export function MuralAccessPanel({
  eventId,
  capsuleActive,
  eventStarted
}: {
  eventId: string;
  capsuleActive: boolean;
  eventStarted: boolean;
}) {
  const [mode, setMode] = useState<Mode>(eventStarted ? "login" : "code");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!capsuleActive) return null;

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
      setMode("login");
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
      setMessage("Solicitação enviada. Aguarde a aprovação do organizador.");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article className="public-event-card public-mural-access">
      <h2 className="public-event-section-title">Mural ao vivo</h2>
      <p className="public-event-message">
        {eventStarted
          ? "Use o e-mail da confirmação de presença e o código enviado para entrar no mural."
          : "Quando o evento começar, você poderá solicitar o código de acesso com o e-mail usado na confirmação de presença."}
      </p>

      <div className="public-mural-access-tabs">
        <button type="button" className={mode === "code" ? "is-active" : ""} onClick={() => setMode("code")}>
          Receber código
        </button>
        <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
          Entrar
        </button>
        <button type="button" className={mode === "request" ? "is-active" : ""} onClick={() => setMode("request")}>
          Solicitar acesso
        </button>
      </div>

      {mode === "request" ? (
        <div className="praesentia-form praesentia-form-stack">
          <label className="field"><span>Nome *</span><input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label>
          <label className="field"><span>Sobrenome *</span><input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
          <label className="field"><span>E-mail *</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="field"><span>WhatsApp</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <button type="button" className="btn" disabled={pending} onClick={requestAccess}>Enviar solicitação</button>
        </div>
      ) : (
        <div className="praesentia-form praesentia-form-stack">
          <label className="field">
            <span>E-mail usado na confirmação *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {mode === "login" ? (
            <label className="field">
              <span>Código de acesso *</span>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 dígitos" maxLength={6} />
            </label>
          ) : null}
          <button
            type="button"
            className="btn"
            disabled={pending || !email.trim() || (mode === "login" && !code.trim())}
            onClick={mode === "login" ? login : requestCode}
          >
            {pending ? "Aguarde..." : mode === "login" ? "Entrar no mural" : "Enviar código por e-mail"}
          </button>
        </div>
      )}

      {error ? <p className="public-rsvp-error">{error}</p> : null}
      {message ? <p className="settings-status is-ok">{message}</p> : null}
    </article>
  );
}
