"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { AppNav } from "@/components/layout/app-nav";
import { createEventAction } from "@/app/criar/actions";

const EVENT_TYPES = [
  { value: "festa_infantil", label: "Festa Infantil", emoji: "🎈" },
  { value: "casamento", label: "Casamento", emoji: "💍" },
  { value: "aniversario", label: "Aniversário", emoji: "🎂" },
  { value: "formatura", label: "Formatura", emoji: "🎓" },
  { value: "corporativo", label: "Corporativo", emoji: "🏢" },
  { value: "outros", label: "Outros", emoji: "✨" }
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn" type="submit" disabled={pending} style={{ alignSelf: "flex-start", padding: "14px 28px" }}>
      {pending ? "Criando evento..." : "Criar evento →"}
    </button>
  );
}

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState("");

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "48px 0 90px", maxWidth: 680 }}>
        <span className="pill">criar evento</span>
        <h1 className="display-i" style={{ fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.95, margin: "14px 0 32px" }}>
          Vamos criar seu convite
        </h1>

        {step === 1 && (
          <section>
            <p style={{ color: "var(--ink-soft)", marginBottom: 24, lineHeight: 1.6 }}>
              Qual é o tipo do seu evento?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => { setSelectedType(type.value); setStep(2); }}
                  className="card"
                  style={{ padding: "22px 18px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <span style={{ fontSize: 32 }}>{type.emoji}</span>
                  <strong className="display" style={{ fontSize: 18 }}>{type.label}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <button type="button" onClick={() => setStep(1)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", marginBottom: 20, fontSize: 14, padding: 0 }}>
              ← Voltar
            </button>

            <form action={createEventAction} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <input type="hidden" name="eventType" value={selectedType} />

              <div className="card" style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 14 }}>sobre o evento</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label>
                    <span>Nome do evento *</span>
                    <input name="title" required maxLength={120} placeholder="Ex: Aniversário de 1 ano da Mavie" />
                  </label>
                  <label>
                    <span>Nome do homenageado / responsável *</span>
                    <input name="hostName" required maxLength={120} placeholder="Ex: Mavie, João e Maria, Dr. Carlos..." />
                  </label>
                  <label>
                    <span>Tema / estilo *</span>
                    <input name="theme" required maxLength={120} placeholder="Ex: Jardim Encantado, Fundo do Mar, Minimalista..." />
                  </label>
                </div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 14 }}>data e horário</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <label style={{ gridColumn: "1 / -1" }}>
                    <span>Data *</span>
                    <input name="date" type="date" required />
                  </label>
                  <label>
                    <span>Início *</span>
                    <input name="startsAt" type="time" required />
                  </label>
                  <label>
                    <span>Fim *</span>
                    <input name="endsAt" type="time" required />
                  </label>
                </div>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 14 }}>local</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label>
                    <span>Nome do local *</span>
                    <input name="venueName" required maxLength={160} placeholder="Ex: Espaço Encantado, Buffet Grill..." />
                  </label>
                  <label>
                    <span>Endereço *</span>
                    <input name="venueAddress" required maxLength={220} placeholder="Rua, número, bairro" />
                  </label>
                  <label>
                    <span>Cidade *</span>
                    <input name="city" required maxLength={120} placeholder="Ex: São Paulo" />
                  </label>
                </div>
              </div>

              <SubmitButton />
              <p style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.5 }}>
                O evento nasce privado. Depois você gera a imagem do convite com IA e compartilha o link.
              </p>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
