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
    <div
      style={{
        minHeight: "100%",
        background: "var(--dark)",
        color: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        padding: "60px 24px 40px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Confetti style={{ opacity: 0.25 }} />
      <div style={{ textAlign: "center", marginBottom: 30, position: "relative" }}>
        <span
          className="pulse"
          style={{ display: "inline-flex", width: 9, height: 9, borderRadius: 99, background: "var(--coral)", marginBottom: 14 }}
        />
        <h1 className="serif-i" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1.05 }}>
          {isMemory ? (
            <>
              A cápsula está
              <br />
              <span style={{ color: "var(--coral)" }}>guardada</span>.
            </>
          ) : (
            <>
              O mural está
              <br />
              <span style={{ color: "var(--coral)" }}>ao vivo</span>.
            </>
          )}
        </h1>
        <p style={{ margin: "10px auto 0", fontSize: 13.5, color: "rgba(244,237,223,.6)", maxWidth: 280 }}>
          Entre para {isMemory ? "revisitar" : "ver e compartilhar"} os momentos de{" "}
          <strong style={{ color: "var(--paper)" }}>{eventTitle ?? "este evento"}</strong>.
        </p>
        {isMemory ? (
          <p style={{ margin: "12px auto 0", fontSize: 12, color: "rgba(244,237,223,.45)", maxWidth: 300 }}>
            {RETENTION_CAPSULE_DESCRIPTION}
          </p>
        ) : null}
      </div>

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", background: "#2a231a", borderRadius: 999, padding: 3, marginBottom: 20 }}>
          {[
            ["codigo", isMemory ? "Tenho código" : "Já confirmei"],
            ["solicitar", isMemory ? "Perdi o acesso" : "Solicitar acesso"]
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFormMode(v === "solicitar" ? "request" : "login")}
              style={{
                flex: 1,
                border: "none",
                cursor: "pointer",
                borderRadius: 999,
                padding: 9,
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 12.5,
                background: tabMode === v ? "var(--paper)" : "transparent",
                color: tabMode === v ? "var(--dark)" : "rgba(244,237,223,.6)",
                transition: "all .15s"
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {formMode === "request" ? (
          <div className="fadeUp">
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              Nome
            </label>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ background: "#2a231a", border: "1px solid var(--dark-line)", color: "var(--paper)", marginBottom: 12 }}
            />
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              Sobrenome
            </label>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{ background: "#2a231a", border: "1px solid var(--dark-line)", color: "var(--paper)", marginBottom: 12 }}
            />
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              E-mail
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: "#2a231a", border: "1px solid var(--dark-line)", color: "var(--paper)", marginBottom: 12 }}
            />
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              WhatsApp
            </label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              style={{ background: "#2a231a", border: "1px solid var(--dark-line)", color: "var(--paper)", marginBottom: 16 }}
            />
            <button type="button" className="btn btn-coral" style={{ width: "100%", padding: 14 }} disabled={pending} onClick={requestAccess}>
              {pending ? "Enviando…" : isMemory ? "Solicitar novo acesso" : "Enviar solicitação"}
            </button>
          </div>
        ) : (
          <div className="fadeUp">
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              E-mail da confirmação
            </label>
            <input
              type="email"
              className="input"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: "#2a231a", border: "1px solid var(--dark-line)", color: "var(--paper)", marginBottom: 16 }}
            />
            <label className="fl" style={{ color: "rgba(244,237,223,.55)" }}>
              Código de acesso (enviado por e-mail)
            </label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{
                background: "#2a231a",
                border: "1px solid var(--dark-line)",
                color: "var(--paper)",
                marginBottom: 20,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                letterSpacing: 6
              }}
            />
            <button
              type="button"
              className="btn btn-coral"
              style={{ width: "100%", padding: 14 }}
              disabled={pending || !email.trim() || code.trim().length < 4}
              onClick={login}
            >
              {pending ? "Entrando…" : isMemory ? "Entrar na cápsula" : "Entrar no mural"}
            </button>
            <button
              type="button"
              style={{
                width: "100%",
                marginTop: 14,
                background: "transparent",
                border: "none",
                color: "rgba(244,237,223,.45)",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "var(--font-sans)"
              }}
              disabled={pending || !email.trim()}
              onClick={requestCode}
            >
              Não recebi o código · reenviar
            </button>
          </div>
        )}

        {error ? <p style={{ color: "var(--coral)", fontSize: 13, marginTop: 14 }}>{error}</p> : null}
        {message ? <p style={{ color: "rgba(244,237,223,.75)", fontSize: 13, marginTop: 14 }}>{message}</p> : null}
      </div>

      <div style={{ marginTop: "auto", textAlign: "center", paddingTop: 30, color: "rgba(244,237,223,.35)" }}>
        <Icon name="lock" size={14} style={{ marginBottom: 6 }} />
        <div className="mono" style={{ fontSize: 9 }}>
          acesso privado · só convidados
        </div>
      </div>
    </div>
  );
}
