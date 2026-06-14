"use client";

import { useState } from "react";
import type { Event, MediaItem } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Confetti, Mono, Polaroid } from "@/components/app/ui/primitives";
import { RETENTION_CAPSULE_DESCRIPTION, RETENTION_MINIMUM_MONTHS } from "@/lib/copy/retention";
import { formatEventDateLong } from "@/lib/events/format-event-date";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";
import { PraesentiaBrandFooter } from "@/components/brand/praesentia-logo";

function CapsulaLock({
  event,
  onSuccess
}: {
  event: Event;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"login" | "request">("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/mural/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      onSuccess();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setPending(false);
    }
  }

  async function requestAccess() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${event.id}/mural/access-request`, {
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
    <div
      style={{
        minHeight: "100%",
        background: "var(--paper)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "40px 26px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", top: 40, right: -30, opacity: 0.4, transform: "rotate(12deg)" }}>
        <Polaroid color="var(--p-rose)" width={120} />
      </div>
      <div style={{ position: "absolute", bottom: 60, left: -30, opacity: 0.35, transform: "rotate(-10deg)" }}>
        <Polaroid color="var(--p-blue)" width={110} />
      </div>

      <div style={{ textAlign: "center", position: "relative" }}>
        <span
          style={{
            width: 62,
            height: 62,
            borderRadius: 99,
            background: "var(--dark)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon name="hourglass" size={28} style={{ color: "var(--amber)" }} />
        </span>
        <Mono style={{ color: "var(--coral-deep)" }}>Cápsula do tempo</Mono>
        <h1 className="serif-i" style={{ fontSize: 32, fontWeight: 600, margin: "10px 0 6px", lineHeight: 1.05 }}>
          {event.title}
        </h1>
        <p style={{ margin: "0 auto 26px", fontSize: 13.5, color: "var(--muted)", maxWidth: 250, lineHeight: 1.5 }}>
          As memórias do dia estão guardadas aqui. Entre para revisitar.
        </p>

        <div className="card" style={{ padding: 20, textAlign: "left" }}>
          <div style={{ display: "flex", background: "var(--card-2)", borderRadius: 999, padding: 3, marginBottom: 16 }}>
            {[
              ["login", "Tenho código"],
              ["request", "Solicitar acesso"]
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMode(v as "login" | "request")}
                style={{
                  flex: 1,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 999,
                  padding: 9,
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: 12.5,
                  background: mode === v ? "#fff" : "transparent",
                  color: mode === v ? "var(--ink)" : "var(--muted)"
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {mode === "request" ? (
            <>
              <Field label="Nome">
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Field>
              <Field label="Sobrenome">
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Field>
              <Field label="E-mail">
                <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="WhatsApp">
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
              </Field>
              <button type="button" className="btn btn-dark" style={{ width: "100%" }} disabled={pending} onClick={requestAccess}>
                Solicitar ao organizador
              </button>
            </>
          ) : (
            <>
              <Field label="E-mail">
                <input type="email" className="input" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Field label="Código de acesso">
                <input
                  className="input"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{ letterSpacing: ".3em", fontFamily: "var(--font-mono)" }}
                />
              </Field>
              <button
                type="button"
                className="btn btn-dark"
                style={{ width: "100%" }}
                disabled={pending || !email.trim() || code.trim().length < 4}
                onClick={login}
              >
                <Icon name="lock" size={15} />
                Abrir a cápsula
              </button>
            </>
          )}
          {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13, marginTop: 12 }}>{error}</p> : null}
          {message ? <p style={{ color: "var(--ink-2)", fontSize: 13, marginTop: 12 }}>{message}</p> : null}
        </div>
        <p style={{ marginTop: 16, fontSize: 11.5, color: "var(--faint)" }}>{RETENTION_CAPSULE_DESCRIPTION}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="fl">{label}</label>
      {children}
    </div>
  );
}

export function CapsulaOpen({
  event,
  media,
  guestName,
  confirmedGuestCount = 0
}: {
  event: Event;
  media: MediaItem[];
  guestName?: string;
  confirmedGuestCount?: number;
}) {
  const photos = media.filter((m) => m.type !== "message");
  const messages = media.filter((m) => m.type === "message");
  const dateLine = formatEventDateLong(event.date) ?? event.date;
  const placeLine = event.venueName === "Local a definir" ? "Local a definir" : event.venueName;
  const retentionUntil = event.capsuleActivatedAt
    ? new Date(new Date(event.capsuleActivatedAt).getTime() + RETENTION_MINIMUM_MONTHS * 30 * 86400000)
    : null;
  const retentionLabel = retentionUntil
    ? `guardada até ${retentionUntil.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`
    : `mínimo ${RETENTION_MINIMUM_MONTHS} meses`;

  return (
    <div className="scroll prototype-guest-scroll" style={{ height: "100%", overflow: "auto", background: "var(--paper)" }}>
      <div style={{ padding: "46px 20px 26px", textAlign: "center", background: "var(--card-2)", borderBottom: "1px solid var(--line)" }}>
        <span className="pill" style={{ borderColor: "var(--line-2)" }}>
          <Icon name="hourglass" size={12} style={{ color: "var(--coral-deep)" }} />
          {retentionLabel}
        </span>
        <h1 className="serif-i" style={{ fontSize: 29, fontWeight: 600, margin: "12px 0 4px" }}>
          {event.title}
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          {dateLine} · {placeLine}
        </p>
        {guestName ? <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--muted)" }}>Olá, {guestName}</p> : null}
        <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 18 }}>
          {[
            [String(photos.length + messages.length), "memórias"],
            [String(Math.max(confirmedGuestCount, 1)), "pessoas"],
            [`${RETENTION_MINIMUM_MONTHS}m`, "garantidos"]
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, fontStyle: "italic" }}>
                {n}
              </div>
              <div className="mono" style={{ fontSize: 8.5 }}>
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "11px 18px", borderBottom: "1px solid var(--line)" }}>
        <Icon name="lock" size={14} style={{ color: "var(--muted)" }} />
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Só para revisitar — sem postar, curtir ou excluir.</span>
      </div>

      <div style={{ padding: "22px 16px 40px" }}>
        <Mono style={{ display: "block", marginBottom: 14 }}>O dia em fotos</Mono>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 14px", marginBottom: 30 }}>
          {photos.map((item, i) => {
            const url = resolveMediaItemUrl(event.id, item);
            return (
              <div key={item.id} style={{ transform: `rotate(${[-3, 2, -1.5, 2.5, -2, 1.5][i % 6]}deg)` }}>
                <div className="polaroid" style={{ width: "100%" }}>
                  <div className="tape" style={{ background: i % 2 ? "var(--tape-c)" : "var(--tape-y)" }} />
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" style={{ width: "100%", aspectRatio: "1/1.08", objectFit: "cover" }} />
                  ) : (
                    <div className="stripe" style={{ aspectRatio: "1/1.08", background: "var(--p-green)" }} />
                  )}
                  {item.caption ? <div className="cap">{item.caption}</div> : null}
                </div>
              </div>
            );
          })}
        </div>

        {messages.length > 0 ? (
          <>
            <Mono style={{ display: "block", marginBottom: 14 }}>Recados guardados</Mono>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
              {messages.map((m) => (
                <div key={m.id} className="card" style={{ padding: "16px 18px" }}>
                  <p className="serif-i" style={{ margin: "0 0 10px", fontSize: 16, lineHeight: 1.4, color: "var(--ink)" }}>
                    "{m.text}"
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Avatar name={m.authorName} size={26} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{m.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div
          className="card"
          style={{
            padding: 20,
            background: "var(--dark)",
            color: "var(--paper)",
            border: "none",
            textAlign: "center",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <Confetti style={{ opacity: 0.3 }} />
          <Mono style={{ color: "var(--amber)", position: "relative" }}>Um lembrete no futuro</Mono>
          <p className="serif-i" style={{ fontSize: 19, margin: "10px 0 4px", position: "relative" }}>
            Suas memórias continuam guardadas aqui.
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(244,237,223,.55)", position: "relative" }}>
            Amplie o prazo a qualquer momento para guardar por mais tempo.
          </p>
        </div>

        <PraesentiaBrandFooter kicker="memórias guardadas com" />
      </div>
    </div>
  );
}

export function PrototypeCapsulaView({
  event,
  media,
  guestRsvpId,
  guestName,
  confirmedGuestCount
}: {
  event: Event;
  media: MediaItem[];
  guestRsvpId?: string;
  guestName?: string;
  confirmedGuestCount?: number;
}) {
  const [unlocked, setUnlocked] = useState(Boolean(guestRsvpId));

  if (!unlocked) {
    return <CapsulaLock event={event} onSuccess={() => window.location.reload()} />;
  }

  return (
    <CapsulaOpen
      event={event}
      media={media}
      guestName={guestName}
      confirmedGuestCount={confirmedGuestCount}
    />
  );
}
