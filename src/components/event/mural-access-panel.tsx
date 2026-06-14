"use client";

import { useState } from "react";
import { Confetti } from "@/components/app/ui/primitives";
import { Icon } from "@/components/app/ui/icon";
import { RETENTION_CAPSULE_DESCRIPTION } from "@/lib/copy/retention";

type PanelMode = "live" | "memory";
type FormMode = "code" | "login" | "request";

export function MuralAccessPanel({
  eventId,
  capsuleActive,
  mode,
  eventTitle
}: {
  eventId: string;
  capsuleActive: boolean;
  mode: PanelMode;
  eventTitle?: string;
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
  const tabMode = formMode === "request" ? "solicitar" : "codigo";

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
    <div className="guest-access-screen">
      <Confetti style={{ opacity: 0.25 }} />
      <div className="guest-access-screen-inner">
        <div className="guest-access-hero">
          <span className="guest-access-dot pulse" />
          <h1 className="serif-i guest-access-title">
            {isMemory ? (
              <>
                A cápsula está
                <br />
                <span className="guest-access-accent">guardada</span>.
              </>
            ) : (
              <>
                O mural está
                <br />
                <span className="guest-access-accent">ao vivo</span>.
              </>
            )}
          </h1>
          <p className="guest-access-lead">
            Entre para {isMemory ? "revisitar" : "ver e compartilhar"} os momentos de{" "}
            <strong>{eventTitle ?? "este evento"}</strong>.
          </p>
          {isMemory ? <p className="guest-access-note">{RETENTION_CAPSULE_DESCRIPTION}</p> : null}
        </div>

        <div className="guest-access-form-wrap">
          <div className="guest-access-tabs">
            {[
              ["codigo", isMemory ? "Tenho código" : "Já confirmei"],
              ["solicitar", isMemory ? "Perdi o acesso" : "Solicitar acesso"]
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFormMode(v === "solicitar" ? "request" : "login")}
                className={`guest-access-tab${tabMode === v ? " is-active" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>

          {formMode === "request" ? (
            <div className="fadeUp guest-access-form">
              <label className="fl guest-access-label">Nome</label>
              <input
                className="input guest-access-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <label className="fl guest-access-label">Sobrenome</label>
              <input
                className="input guest-access-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <label className="fl guest-access-label">E-mail</label>
              <input
                type="email"
                className="input guest-access-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="fl guest-access-label">WhatsApp</label>
              <input
                className="input guest-access-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
              <button type="button" className="btn btn-coral guest-access-submit" disabled={pending} onClick={requestAccess}>
                {pending ? "Enviando…" : isMemory ? "Solicitar novo acesso" : "Enviar solicitação"}
              </button>
            </div>
          ) : (
            <div className="fadeUp guest-access-form">
              <label className="fl guest-access-label">E-mail da confirmação</label>
              <input
                type="email"
                className="input guest-access-input"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label className="fl guest-access-label">Código de acesso (enviado por e-mail)</label>
              <input
                className="input guest-access-input guest-access-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
              />
              <button
                type="button"
                className="btn btn-coral guest-access-submit"
                disabled={pending || !email.trim() || code.trim().length < 4}
                onClick={login}
              >
                {pending ? "Entrando…" : isMemory ? "Entrar na cápsula" : "Entrar no mural"}
              </button>
              <button
                type="button"
                className="guest-access-resend"
                disabled={pending || !email.trim()}
                onClick={requestCode}
              >
                Não recebi o código · reenviar
              </button>
            </div>
          )}

          {error ? <p className="guest-access-error">{error}</p> : null}
          {message ? <p className="guest-access-message">{message}</p> : null}
        </div>

        <div className="guest-access-footer">
          <Icon name="lock" size={14} />
          <div className="mono">acesso privado · só convidados</div>
        </div>
      </div>
    </div>
  );
}
