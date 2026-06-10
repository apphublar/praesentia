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
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionDraft, setCompanionDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const partySize = 1 + companions.length;

  function addCompanion() {
    const trimmed = companionDraft.trim();
    if (!trimmed) return;
    setCompanions((current) => [...current, trimmed]);
    setCompanionDraft("");
    setError("");
  }

  function removeCompanion(index: number) {
    setCompanions((current) => current.filter((_, i) => i !== index));
  }

  async function handleConfirm(wantsCapsule: boolean) {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: name.trim(),
          phone: phone.trim() || undefined,
          companionNames: companions,
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
          {companions.length ? (
            <>
              {" "}
              Sua família ({partySize} pessoa{partySize !== 1 ? "s" : ""}) está confirmada para <strong>{eventTitle}</strong>.
            </>
          ) : (
            <> Sua presença em <strong>{eventTitle}</strong> está confirmada.</>
          )}
        </p>
        {companions.length ? (
          <ul className="public-rsvp-companion-list">
            <li>{name.trim()}</li>
            {companions.map((companion) => (
              <li key={companion}>{companion}</li>
            ))}
          </ul>
        ) : null}
        {companions.length ? (
          <p className="public-event-message" style={{ fontSize: 14 }}>
            No dia do evento, entrem juntos na portaria — a entrada será registrada para todos de uma vez.
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
      <p className="public-event-message">
        Informe seu nome completo. Se vier com família ou acompanhantes, adicione o nome de cada pessoa.
      </p>
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

        <div className="public-rsvp-companions-block">
          <span className="field">
            <span>Acompanhantes</span>
          </span>
          {companions.length ? (
            <ul className="public-rsvp-companion-list">
              {companions.map((companion, index) => (
                <li key={`${companion}-${index}`}>
                  <span>{companion}</span>
                  <button type="button" className="public-rsvp-companion-remove" onClick={() => removeCompanion(index)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="public-rsvp-companion-add-row">
            <input
              type="text"
              value={companionDraft}
              onChange={(e) => setCompanionDraft(e.target.value)}
              placeholder="Nome completo do acompanhante"
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompanion();
                }
              }}
            />
            <button type="button" className="btn secondary" onClick={addCompanion} disabled={!companionDraft.trim()}>
              Adicionar
            </button>
          </div>
          {companions.length ? (
            <p className="cover-field-help">
              Total: {partySize} pessoa{partySize !== 1 ? "s" : ""} (você + {companions.length} acompanhante{companions.length !== 1 ? "s" : ""})
            </p>
          ) : (
            <p className="cover-field-help">Opcional. Adicione quantos acompanhantes forem levar.</p>
          )}
        </div>

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
          disabled={!name.trim() || pending}
          onClick={() => (capsuleAvailable ? setStep("capsule") : handleConfirm(false))}
        >
          {pending
            ? "Confirmando..."
            : partySize > 1
              ? `Confirmar presença (${partySize} pessoas)`
              : "Confirmar presença"}
        </button>
      </div>
    </section>
  );
}
