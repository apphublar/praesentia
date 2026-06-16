"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventAction } from "@/app/criar/actions";
import { createEventFieldErrorMessage, type CreateEventState } from "@/app/criar/create-event-state";
import { GiftSuggestionsEditor } from "@/components/criar/gift-suggestions-editor";
import { createEventContinuePath } from "@/lib/auth/routes";
import { getEventProfile } from "@/lib/events/event-profile";
import { EVENT_TYPE_OPTIONS } from "@/lib/events/event-types";
import type { EventType } from "@/types/domain";

export function CreateEventFlow() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEventAction, null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<EventType | "">("");
  const [eventFormat, setEventFormat] = useState<"in_person" | "online">("in_person");
  const [showAllTypes, setShowAllTypes] = useState(false);

  const profile = selectedType ? getEventProfile(selectedType) : null;

  const visibleTypes = useMemo(
    () => (showAllTypes ? EVENT_TYPE_OPTIONS : EVENT_TYPE_OPTIONS.filter((item) => item.popular || item.value === "outros")),
    [showAllTypes]
  );

  const selectedLabel = EVENT_TYPE_OPTIONS.find((item) => item.value === selectedType)?.label;
  const actionError = state?.error ?? createEventFieldErrorMessage(state?.fieldError) ?? "";

  useEffect(() => {
    if (state?.eventId) {
      router.push(createEventContinuePath(state.eventId));
    }
  }, [state?.eventId, router]);

  function goToDetailsStep() {
    if (!selectedType) return;
    if (getEventProfile(selectedType).needsFormatStep) {
      setStep(2);
      return;
    }
    setStep(3);
  }

  function backFromDetails() {
    if (profile?.needsFormatStep) {
      setStep(2);
      return;
    }
    setStep(1);
  }

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
          <div className="create-step-actions">
            <button type="button" className="btn secondary" onClick={() => setShowAllTypes((value) => !value)}>
              {showAllTypes ? "Ver menos ↑" : "Ver mais opções ↓"}
            </button>
            <button type="button" className="btn" disabled={!selectedType} onClick={goToDetailsStep}>
              Continuar →
            </button>
          </div>
        </section>
      )}

      {step === 2 && profile?.needsFormatStep && (
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

      {step === 3 && selectedType && profile && (
        <section>
          <button type="button" className="create-back-btn" onClick={backFromDetails}>
            ← Voltar
          </button>

          <form action={formAction} className="praesentia-form praesentia-form-stack">
            <input type="hidden" name="eventType" value={selectedType} />
            <input type="hidden" name="eventFormat" value={profile.isFundraising ? "fundraising" : eventFormat} />

            {profile.isFundraising ? (
              <>
                <div className="card create-form-section">
                  <div className="create-form-kicker">sua vaquinha · arrecadação via Pix</div>
                  <p className="create-form-help">
                    Crie uma campanha como no Vakinha: conte a história, defina a meta e compartilhe o link para receber
                    contribuições via Pix. A Praesentia não intermedia pagamentos.
                  </p>
                  <div className="create-form-fields">
                    <label className="field">
                      <span>Nome da vaquinha *</span>
                      <input name="title" required maxLength={120} placeholder="Ex: Tratamento da Maria, Reforma da escola..." />
                    </label>
                    <label className="field">
                      <span>Organizador *</span>
                      <input name="hostName" required maxLength={120} placeholder="Quem está organizando a arrecadação" />
                    </label>
                    <label className="field">
                      <span>Categoria / tema</span>
                      <input name="theme" maxLength={120} placeholder="Ex: Saúde, Educação, Emergência..." />
                    </label>
                    <label className="field">
                      <span>História da vaquinha *</span>
                      <textarea name="story" required maxLength={4000} placeholder="Conte por que a arrecadação é importante, para quem é e como a ajuda será usada." />
                    </label>
                  </div>
                </div>

                <div className="card create-form-section">
                  <div className="create-form-kicker">meta e prazo</div>
                  <div className="create-form-fields create-form-fields-grid">
                    <label className="field">
                      <span>Meta total a arrecadar em R$ (opcional)</span>
                      <input name="goalAmount" inputMode="decimal" placeholder="Ex: 5000" />
                    </label>
                    <label className="field">
                      <span>Contribuição mínima por pessoa em R$ (opcional)</span>
                      <input name="minPerPerson" inputMode="decimal" placeholder="Ex: 50" />
                    </label>
                    <label className="field">
                      <span>Prazo (opcional)</span>
                      <input name="date" type="date" className="native-picker-field" />
                    </label>
                    <input type="hidden" name="startsAt" value="00:00" />
                    <input type="hidden" name="endsAt" value="23:59" />
                  </div>
                </div>

                <div className="card create-form-section">
                  <div className="create-form-kicker">Pix para receber *</div>
                  <div className="create-form-fields">
                    <label className="field">
                      <span>Nome do recebedor *</span>
                      <input name="pixReceiverName" required maxLength={120} placeholder="Nome completo ou razão social" />
                    </label>
                    <label className="field">
                      <span>Chave Pix *</span>
                      <input name="pixKey" required maxLength={120} placeholder="CPF, CNPJ, email, telefone ou chave aleatória" />
                    </label>
                  </div>
                </div>

                <div className="card create-form-section">
                  <div className="create-form-kicker">confirmação de convidados</div>
                  <label className="create-checkbox-field">
                    <input type="checkbox" name="rsvpEnabled" value="1" />
                    <span>
                      Quero que os convidados confirmem presença e informem nome, WhatsApp e valor enviado via Pix
                    </span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="card create-form-section">
                  <div className="create-form-kicker">
                    sobre o evento · {eventFormat === "online" ? "online" : "presencial"}
                  </div>
                  <div className="create-form-fields">
                    <label className="field">
                      <span>Nome do evento *</span>
                      <input name="title" required maxLength={120} placeholder="Ex: Aniversário de 1 ano da Mavie Fontinhas" />
                    </label>
                    <label className="field">
                      <span>Nome do homenageado(a) (opcional)</span>
                      <input name="hostName" maxLength={120} placeholder="Ex: Mavie, João... (ou deixe em branco)" />
                    </label>
                    <label className="field">
                      <span>Quem está organizando *</span>
                      <input name="organizerName" required maxLength={120} placeholder="Ex: Maria Silva (mãe)" />
                    </label>
                    <label className="field">
                      <span>Tema / estilo *</span>
                      <input name="theme" required maxLength={120} placeholder="Ex: Jardim Encantado, Minimalista..." />
                    </label>
                  </div>
                </div>

                <div className="card create-form-section">
                  <div className="create-form-kicker">data e horário</div>
                  <div className="create-form-fields create-form-fields-grid create-datetime-grid">
                    <label className="field field-span-full">
                      <span>Data *</span>
                      <input name="date" type="date" required className="native-picker-field" />
                    </label>
                    <label className="field field-span-full">
                      <span>Confirmar presença até (opcional)</span>
                      <input name="rsvpDeadline" type="date" className="native-picker-field" />
                      <p className="cover-field-help">Após essa data o link mostra a contagem para o evento.</p>
                    </label>
                    <label className="field">
                      <span>Início *</span>
                      <input name="startsAt" type="time" required className="native-picker-field" />
                    </label>
                    <label className="field">
                      <span>Fim *</span>
                      <input name="endsAt" type="time" required className="native-picker-field" />
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
                        <input name="venueName" required maxLength={160} placeholder="Ex: Espaço Encantado..." />
                      </label>
                      <label className="field">
                        <span>Endereço *</span>
                        <input name="venueAddress" required maxLength={220} placeholder="Rua, número, bairro" />
                      </label>
                      <div className="create-form-fields-grid">
                        <label className="field">
                          <span>CEP</span>
                          <input name="venueZip" maxLength={12} placeholder="00000-000" />
                        </label>
                        <label className="field">
                          <span>Complemento</span>
                          <input name="venueComplement" maxLength={120} placeholder="Apto, bloco, salão..." />
                        </label>
                      </div>
                      <label className="field">
                        <span>Cidade *</span>
                        <input name="city" required maxLength={120} placeholder="Ex: São Paulo" />
                      </label>
                    </div>
                  </div>
                )}

                <GiftSuggestionsEditor />
              </>
            )}

            <button className="btn create-submit-btn" type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Continuar para texto e imagem →"}
            </button>
            {actionError ? <p style={{ color: "var(--coral)", fontSize: 13, margin: 0 }}>{actionError}</p> : null}
            <p className="create-form-note">
              Plano gratuito: convite, texto, imagem e compartilhamento. Mural ao vivo e cápsula (R$59) ficam no painel do evento.
            </p>
          </form>
        </section>
      )}
    </>
  );
}
