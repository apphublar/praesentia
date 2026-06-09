"use client";

import { useState } from "react";

type Step = "form" | "capsule" | "done";

export function RsvpForm({
  eventId,
  eventTitle,
  capsuleAvailable = false
}: {
  eventId: string;
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
      if (!res.ok) { setError(data.error ?? "Erro ao confirmar."); setPending(false); return; }
      setStep("done");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setPending(false);
  }

  if (step === "done") {
    return (
      <section className="card" style={{ padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <h2 className="display" style={{ fontSize: 28, margin: "0 0 8px" }}>Presença confirmada!</h2>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Obrigado, <strong>{name}</strong>! Sua presença em <strong>{eventTitle}</strong> está confirmada.
        </p>
      </section>
    );
  }

  if (step === "capsule" && capsuleAvailable) {
    return (
      <section className="card" style={{ padding: 28 }}>
        <h2 className="display" style={{ fontSize: 26, margin: "0 0 12px" }}>Participar da cápsula do tempo?</h2>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 20 }}>
          Durante o evento você pode compartilhar fotos e vídeos que ficam guardados por <strong>36 meses</strong> — a cápsula do tempo do evento.
          Para isso, você precisa criar uma conta agora (leva 30 segundos).
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a className="btn" href={`/login?next=/evento/${eventId}`} style={{ flex: 1, textAlign: "center" }}>
            Criar conta e participar
          </a>
          <button className="btn secondary" type="button" style={{ flex: 1 }} onClick={() => handleConfirm(false)} disabled={pending}>
            {pending ? "Confirmando..." : "Só confirmar presença"}
          </button>
        </div>
        {error && <p style={{ color: "var(--coral)", marginTop: 12 }}>{error}</p>}
      </section>
    );
  }

  return (
    <section className="card" style={{ padding: 28 }}>
      <h2 className="display" style={{ fontSize: 26, margin: "0 0 6px" }}>Confirmar presença</h2>
      <p style={{ color: "var(--ink-soft)", marginBottom: 20, lineHeight: 1.6 }}>
        Informe seus dados para confirmar que você vai estar lá.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label>
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
        <label>
          <span>WhatsApp (opcional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={20}
          />
        </label>
        {error && <p style={{ color: "var(--coral)" }}>{error}</p>}
        <button
          className="btn"
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
