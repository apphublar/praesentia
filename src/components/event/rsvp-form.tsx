"use client";

import { useState } from "react";

type Step = "form" | "capsule" | "done";

export function RsvpForm({
  eventId,
  eventSlug,
  eventTitle,
  capsuleAvailable = false
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  capsuleAvailable?: boolean;
}) {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasCompanion, setHasCompanion] = useState(false);
  const [companionName, setCompanionName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(wantsCapsule: boolean) {
    if (hasCompanion && !companionName.trim()) {
      setError("Informe o nome completo do acompanhante.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name.trim(),
          phone: phone.trim() || undefined,
          companionName: hasCompanion ? companionName.trim() : undefined,
          wantsCapsule
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao confirmar.");
        setPending(false);
        return;
      }
      setStep("done");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setPending(false);
  }

  if (step === "done") {
    return (
      <section className="public-rsvp-state">
        <div className="public-rsvp-icon" aria-hidden="true">
          🎉
        </div>
        <h2 className="public-event-section-title">Presença confirmada!</h2>
        <p className="public-event-message">
          Obrigado, <strong>{name}</strong>!
          {hasCompanion && companionName.trim() ? (
            <> Você e <strong>{companionName.trim()}</strong> estão confirmados para <strong>{eventTitle}</strong>.</>
          ) : (
            <> Sua presença em <strong>{eventTitle}</strong> está confirmada.</>
          )}
        </p>
        {hasCompanion && companionName.trim() ? (
          <p className="public-event-message" style={{ fontSize: 14 }}>
            No dia do evento, entrem juntos na portaria — a entrada será registrada para os dois.
          </p>
        ) : null}
        {capsuleAvailable ? (
          <a className="btn public-rsvp-action" href={`/login?next=/evento/${eventSlug}`}>
            Criar conta para participar do mural
          </a>
        ) : null}
      </section>
    );
  }

  if (step === "capsule" && capsuleAvailable) {
    return (
      <section className="public-rsvp-state">
        <h2 className="public-event-section-title">Participar da cápsula do tempo?</h2>
        <p className="public-event-message">
          Durante o evento você pode compartilhar fotos e recados que ficam guardados por <strong>36 meses</strong>.
          Para isso, crie uma conta agora — leva menos de um minuto.
        </p>
        <div className="public-rsvp-actions">
          <a className="btn public-rsvp-action" href={`/login?next=/evento/${eventSlug}`}>
            Criar conta e participar
          </a>
          <button className="btn secondary public-rsvp-action" type="button" onClick={() => handleConfirm(false)} disabled={pending}>
            {pending ? "Confirmando..." : "Só confirmar presença"}
          </button>
        </div>
        {error ? <p className="public-rsvp-error">{error}</p> : null}
      </section>
    );
  }

  return (
    <section className="public-rsvp-form">
      <h2 className="public-event-section-title">Confirmar presença</h2>
      <p className="public-event-message">Informe seu nome completo. Se vier com acompanhante, inclua o nome dele(a) também.</p>
      <div className="praesentia-form praesentia-form-stack">
        <label className="field">
          <span>Nome completo *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome como no documento ou convite"
            maxLength={120}
            required
          />
        </label>

        <label className="settings-switch public-rsvp-companion-toggle">
          <input
            type="checkbox"
            checked={hasCompanion}
            onChange={(e) => {
              setHasCompanion(e.target.checked);
              if (!e.target.checked) setCompanionName("");
            }}
          />
          <span>Vou levar acompanhante</span>
        </label>

        {hasCompanion ? (
          <label className="field public-rsvp-companion-field">
            <span>Nome completo do acompanhante *</span>
            <input
              type="text"
              value={companionName}
              onChange={(e) => setCompanionName(e.target.value)}
              placeholder="Nome completo de quem vem com você"
              maxLength={120}
            />
            <p className="cover-field-help">No check-in do evento, vocês entram juntos com um único registro.</p>
          </label>
        ) : null}

        <label className="field">
          <span>WhatsApp (opcional, só para o organizador)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </label>

        {error ? <p className="public-rsvp-error">{error}</p> : null}
        <button
          className="btn public-rsvp-action"
          type="button"
          disabled={!name.trim() || pending || (hasCompanion && !companionName.trim())}
          onClick={() => (capsuleAvailable ? setStep("capsule") : handleConfirm(false))}
        >
          {pending ? "Confirmando..." : hasCompanion ? "Confirmar presença (2 pessoas)" : "Confirmar presença"}
        </button>
      </div>
    </section>
  );
}
