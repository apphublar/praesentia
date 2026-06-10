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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(wantsCapsule: boolean) {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name.trim(), phone: phone.trim() || undefined, wantsCapsule })
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
          Obrigado, <strong>{name}</strong>! Sua presença em <strong>{eventTitle}</strong> está confirmada.
        </p>
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
      <p className="public-event-message">Informe seus dados para confirmar que você vai estar lá.</p>
      <div className="praesentia-form praesentia-form-stack">
        <label className="field">
          <span>Seu nome *</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Como você quer ser chamado(a)?"
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>WhatsApp (opcional)</span>
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
          {pending ? "Confirmando..." : "Confirmar presença"}
        </button>
      </div>
    </section>
  );
}
