"use client";

import { useFormStatus } from "react-dom";
import { useMemo, useState } from "react";
import { createEventAction } from "@/app/criar/actions";
import { EVENT_TYPE_OPTIONS } from "@/lib/events/event-types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn create-submit-btn" type="submit" disabled={pending}>
      {pending ? "Criando evento..." : "Criar evento →"}
    </button>
  );
}

export function CreateEventFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState("");
  const [eventFormat, setEventFormat] = useState<"in_person" | "online">("in_person");
  const [showAllTypes, setShowAllTypes] = useState(false);

  const visibleTypes = useMemo(
    () => (showAllTypes ? EVENT_TYPE_OPTIONS : EVENT_TYPE_OPTIONS.filter((item) => item.popular || item.value === "outros")),
    [showAllTypes]
  );

  const selectedLabel = EVENT_TYPE_OPTIONS.find((item) => item.value === selectedType)?.label;

  return (
    <>
      {step === 1 && (
        <section>
          <p className="create-step-lead">Escolha o tipo de evento *</p>
          <div className="event-type-grid">
            {visibleTypes.map((type) => {
              const selected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`event-type-option${selected ? " is-selected" : ""}`}
                >
                  {selected && <span className="event-type-check" aria-hidden>✓</span>}
                  <span className="event-type-emoji">{type.emoji}</span>
                  <span className="event-type-label">{type.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
            <button type="button" className="btn secondary" onClick={() => setShowAllTypes((value) => !value)}>
              {showAllTypes ? "Ver menos ↑" : "Ver mais opções ↓"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={!selectedType}
              onClick={() => setStep(2)}
            >
              Continuar →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <button type="button" className="create-back-btn" onClick={() => setStep(1)}>
            ← Voltar
          </button>
          <p className="create-step-lead">O evento será presencial ou online?</p>
          {selectedLabel && (
            <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "0 0 16px" }}>
              Tipo selecionado: <strong>{selectedLabel}</strong>
            </p>
          )}
          <div className="format-choice-grid">
            {[
              { value: "in_person" as const, label: "Presencial", desc: "Informe o local do evento", emoji: "📍" },
              { value: "online" as const, label: "Online", desc: "Compartilhe o link da reunião", emoji: "💻" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setEventFormat(option.value);
                  setStep(3);
                }}
                className={`format-choice-card${eventFormat === option.value ? " is-selected" : ""}`}
              >
                <span style={{ fontSize: 28 }}>{option.emoji}</span>
                <strong className="display" style={{ fontSize: 20 }}>{option.label}</strong>
                <p>{option.desc}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <button type="button" className="create-back-btn" onClick={() => setStep(2)}>
            ← Voltar
          </button>

          <form action={createEventAction} className="praesentia-form praesentia-form-stack">
            <input type="hidden" name="eventType" value={selectedType} />
            <input type="hidden" name="eventFormat" value={eventFormat} />

            <div className="card create-form-section">
              <div className="create-form-kicker">
                sobre o evento · {eventFormat === "online" ? "online" : "presencial"}
              </div>
              <div className="create-form-fields">
                <label className="field">
                  <span>Nome do evento *</span>
                  <input name="title" required maxLength={120} placeholder="Ex: Aniversário de 1 ano da Mavie" />
                </label>
                <label className="field">
                  <span>Nome do homenageado / responsável *</span>
                  <input name="hostName" required maxLength={120} placeholder="Ex: Mavie, João e Maria, Dr. Carlos..." />
                </label>
                <label className="field">
                  <span>Tema / estilo *</span>
                  <input name="theme" required maxLength={120} placeholder="Ex: Jardim Encantado, Fundo do Mar, Minimalista..." />
                </label>
              </div>
            </div>

            <div className="card create-form-section">
              <div className="create-form-kicker">data e horário</div>
              <div className="create-form-fields create-form-fields-grid">
                <label className="field field-span-full">
                  <span>Data *</span>
                  <input name="date" type="date" required />
                </label>
                <label className="field">
                  <span>Início *</span>
                  <input name="startsAt" type="time" required />
                </label>
                <label className="field">
                  <span>Fim *</span>
                  <input name="endsAt" type="time" required />
                </label>
              </div>
            </div>

            {eventFormat === "online" ? (
              <div className="card create-form-section">
                <div className="create-form-kicker">link do evento</div>
                <label className="field">
                  <span>URL da reunião (Meet, Zoom, Teams...) *</span>
                  <input name="onlineMeetingUrl" required maxLength={300} placeholder="https://meet.google.com/..." />
                </label>
              </div>
            ) : (
              <div className="card create-form-section">
                <div className="create-form-kicker">local</div>
                <div className="create-form-fields">
                  <label className="field">
                    <span>Nome do local *</span>
                    <input name="venueName" required maxLength={160} placeholder="Ex: Espaço Encantado, Buffet Grill..." />
                  </label>
                  <label className="field">
                    <span>Endereço *</span>
                    <input name="venueAddress" required maxLength={220} placeholder="Rua, número, bairro" />
                  </label>
                  <label className="field">
                    <span>Cidade *</span>
                    <input name="city" required maxLength={120} placeholder="Ex: São Paulo" />
                  </label>
                </div>
              </div>
            )}

            <SubmitButton />
            <p className="create-form-note">
              O evento nasce no plano gratuito: convite, RSVP, lista de presença e check-in.
              Para mural ao vivo e cápsula do tempo, ative a Cápsula (R$59) depois no painel.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
