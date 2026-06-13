"use client";

import { useState } from "react";
import type { GuestCompanionDetail } from "@/types/domain";
import { RETENTION_UPSELL_SHORT } from "@/lib/copy/retention";
import { formatEventDateLong } from "@/lib/events/format-event-date";

type Step = "form" | "capsule" | "done";

type CompanionRow = {
  id: string;
  name: string;
  type: "adult" | "child";
  age: string;
};

function createRowId() {
  return `cmp_${Math.random().toString(36).slice(2, 9)}`;
}

function buildGuestName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

export function RsvpForm({
  eventId,
  eventSlug,
  eventTitle,
  rsvpDeadline,
  capsuleAvailable = false,
  collectPixAmount = false,
  minPerPerson,
  variant = "default"
}: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  rsvpDeadline?: string;
  capsuleAvailable?: boolean;
  collectPixAmount?: boolean;
  minPerPerson?: number;
  variant?: "default" | "prototype";
}) {
  const rsvpDeadlineLabel = rsvpDeadline ? formatEventDateLong(rsvpDeadline) : null;
  const [step, setStep] = useState<Step>("form");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pixAmount, setPixAmount] = useState("");
  const [companions, setCompanions] = useState<CompanionRow[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"confirmed" | "declined">("confirmed");

  const guestName = buildGuestName(firstName, lastName);
  const partySize = 1 + companions.filter((item) => item.name.trim()).length;

  function addCompanion() {
    setCompanions((current) => [...current, { id: createRowId(), name: "", type: "adult", age: "" }]);
  }

  function updateCompanion(id: string, patch: Partial<CompanionRow>) {
    setCompanions((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeCompanion(id: string) {
    setCompanions((current) => current.filter((item) => item.id !== id));
  }

  function companionsDetail(): GuestCompanionDetail[] {
    const detail: GuestCompanionDetail[] = [];
    for (const item of companions) {
      const name = item.name.trim();
      if (!name) continue;
      const age = item.type === "child" && item.age.trim() ? Number(item.age.replace(",", ".")) : undefined;
      detail.push({
        name,
        type: item.type,
        age: Number.isFinite(age) ? age : undefined
      });
    }
    return detail;
  }

  function validateForm(status: "confirmed" | "declined") {
    if (!termsAccepted) {
      setError("Marque a caixa de aceite dos Termos de Uso e Política de Privacidade.");
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Informe nome e sobrenome.");
      return false;
    }
    if (!email.trim()) {
      setError("Informe seu e-mail.");
      return false;
    }
    if (!phone.trim()) {
      setError("Informe seu WhatsApp.");
      return false;
    }
    if (status === "confirmed" && collectPixAmount) {
      const amount = Number(pixAmount.replace(",", "."));
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Informe o valor enviado via Pix.");
        return false;
      }
      if (minPerPerson && amount < minPerPerson) {
        setError(`O valor mínimo informado pelo organizador é R$ ${minPerPerson.toLocaleString("pt-BR")}.`);
        return false;
      }
    }
    for (const companion of companions) {
      if (!companion.name.trim()) continue;
      if (companion.type === "child" && !companion.age.trim()) {
        setError("Informe a idade de cada criança acompanhante.");
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(status: "confirmed" | "declined", wantsCapsule = false) {
    setRsvpStatus(status);
    if (!validateForm(status)) return;

    setPending(true);
    setError("");
    try {
      const detail = companionsDetail();
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestFirstName: firstName.trim(),
          guestLastName: lastName.trim(),
          guestEmail: email.trim(),
          phone: phone.trim(),
          companionNames: detail.map((item) => item.name),
          companionsDetail: detail,
          rsvpStatus: status,
          pixContributedAmount:
            status === "confirmed" && collectPixAmount
              ? Number(pixAmount.replace(",", "."))
              : undefined,
          termsAcceptedAt: new Date().toISOString(),
          wantsCapsule
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar resposta.");
        setPending(false);
        return;
      }
      setStep("done");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setPending(false);
  }

  if (step === "done" && variant === "prototype") {
    return (
      <div className="card pop" style={{ padding: 22, textAlign: "center", border: "1.5px solid #7d9a6f" }}>
        <div style={{ width: 50, height: 50, borderRadius: 99, background: "#7d9a6f", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 24 }}>✓</span>
        </div>
        <h3 className="serif-i" style={{ fontSize: 22, margin: 0 }}>
          {rsvpStatus === "confirmed" ? "Presença confirmada!" : "Resposta registrada"}
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-2)" }}>
          Que alegria ter você{partySize > 1 ? `. Anotamos ${partySize} pessoas.` : "."}
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <section className="public-rsvp-state">
        <div className="public-rsvp-icon" aria-hidden="true">
          {rsvpStatus === "confirmed" ? "🎉" : "💌"}
        </div>
        <h2 className="public-event-section-title">
          {rsvpStatus === "confirmed" ? "Presença confirmada!" : "Resposta registrada"}
        </h2>
        <p className="public-event-message">
          {rsvpStatus === "confirmed" ? (
            <>
              Obrigado, <strong>{guestName}</strong>! Sua presença em <strong>{eventTitle}</strong> está confirmada
              {partySize > 1 ? ` para ${partySize} pessoas` : ""}.
            </>
          ) : (
            <>
              Obrigado, <strong>{guestName}</strong>. Registramos que você não poderá comparecer a <strong>{eventTitle}</strong>.
            </>
          )}
        </p>
        {capsuleAvailable && rsvpStatus === "confirmed" ? (
          <p className="public-event-message public-event-retention-note">
            No dia do evento, volte a este link e entre no mural ao vivo com o e-mail <strong>{email}</strong> e o código que enviaremos.
          </p>
        ) : null}
      </section>
    );
  }

  if (step === "capsule" && capsuleAvailable) {
    return (
      <section className="public-rsvp-state">
        <h2 className="public-event-section-title">Participar do mural e da cápsula?</h2>
        <p className="public-event-message">{RETENTION_UPSELL_SHORT}</p>
        <p className="public-event-message">
          Durante o evento você poderá publicar fotos e recados neste mesmo link, usando o e-mail informado acima.
        </p>
        <div className="public-rsvp-actions">
          <button className="btn public-rsvp-action" type="button" onClick={() => handleSubmit("confirmed", true)} disabled={pending}>
            {pending ? "Confirmando..." : "Sim, quero participar"}
          </button>
          <button className="btn secondary public-rsvp-action" type="button" onClick={() => handleSubmit("confirmed", false)} disabled={pending}>
            Só confirmar presença
          </button>
        </div>
        {error ? <p className="public-rsvp-error">{error}</p> : null}
      </section>
    );
  }

  if (variant === "prototype") {
    const extra = companions.length;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <input
          className="input"
          placeholder="Seu nome"
          value={`${firstName}${lastName ? ` ${lastName}` : ""}`.trim()}
          onChange={(e) => {
            const parts = e.target.value.trim().split(/\s+/);
            setFirstName(parts[0] ?? "");
            setLastName(parts.slice(1).join(" "));
          }}
        />
        <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="tel" placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px" }}>
          <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontWeight: 600 }}>Acompanhantes</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <StepBtn onClick={() => setCompanions((c) => c.slice(0, -1))}>–</StepBtn>
            <span style={{ width: 18, textAlign: "center", fontWeight: 700 }}>{extra}</span>
            <StepBtn onClick={() => setCompanions((c) => [...c, { id: createRowId(), name: "", type: "adult", age: "" }])}>+</StepBtn>
          </div>
        </div>
        {companions.map((companion) => (
          <input
            key={companion.id}
            className="input"
            placeholder="Nome do acompanhante"
            value={companion.name}
            onChange={(e) => updateCompanion(companion.id, { name: e.target.value })}
          />
        ))}
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "var(--muted)" }}>
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            Concordo com os <a href="/termos" target="_blank" rel="noopener noreferrer">Termos</a> e a{" "}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer">Privacidade</a>.
          </span>
        </label>
        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13, margin: 0 }}>{error}</p> : null}
        <button type="button" className="btn btn-coral" style={{ width: "100%" }} disabled={pending} onClick={() => (capsuleAvailable ? setStep("capsule") : handleSubmit("confirmed"))}>
          {pending ? "Enviando…" : "Confirmar presença"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%" }} disabled={pending} onClick={() => handleSubmit("declined")}>
          Não vou
        </button>
      </div>
    );
  }

  return (
    <section className="public-rsvp-form">
      <h2 className="public-event-section-title">Confirmar presença</h2>
      <p className="public-event-message">
        Este é o primeiro passo: informe seus dados para o organizador saber se você vai comparecer.
        {rsvpDeadlineLabel ? ` Responda até ${rsvpDeadlineLabel}.` : ""}
      </p>

      <div className="praesentia-form praesentia-form-stack public-rsvp-fields">
        <div className="public-rsvp-name-row">
          <label className="field">
            <span>Nome *</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Digite seu nome" maxLength={80} />
          </label>
          <label className="field">
            <span>Sobrenome *</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Digite seu sobrenome" maxLength={80} />
          </label>
        </div>
        <label className="field">
          <span>Email *</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite seu email" maxLength={160} />
        </label>
        <label className="field">
          <span>WhatsApp *</span>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" maxLength={20} />
        </label>

        {collectPixAmount ? (
          <label className="field">
            <span>Valor enviado via Pix *</span>
            <input
              inputMode="decimal"
              value={pixAmount}
              onChange={(e) => setPixAmount(e.target.value)}
              placeholder={minPerPerson ? `Mínimo R$ ${minPerPerson}` : "Ex: 50,00"}
            />
          </label>
        ) : null}

        <div className="public-rsvp-companions-block">
          {companions.map((companion) => (
            <div key={companion.id} className="public-rsvp-companion-row">
              <select
                value={companion.type}
                onChange={(e) => updateCompanion(companion.id, { type: e.target.value as "adult" | "child" })}
                aria-label="Tipo de acompanhante"
              >
                <option value="adult">Adulto</option>
                <option value="child">Criança</option>
              </select>
              <input
                value={companion.name}
                onChange={(e) => updateCompanion(companion.id, { name: e.target.value })}
                placeholder="Nome do acompanhante"
                maxLength={120}
              />
              {companion.type === "child" ? (
                <input
                  value={companion.age}
                  onChange={(e) => updateCompanion(companion.id, { age: e.target.value })}
                  placeholder="Idade"
                  inputMode="numeric"
                  maxLength={3}
                  className="public-rsvp-age-input"
                />
              ) : null}
              <button type="button" className="public-rsvp-companion-remove" onClick={() => removeCompanion(companion.id)} aria-label="Remover acompanhante">
                🗑
              </button>
            </div>
          ))}
          <button type="button" className="btn secondary public-rsvp-add-companion" onClick={addCompanion}>
            + Adicionar acompanhante
          </button>
        </div>

        <label className="public-rsvp-terms">
          <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
          <span>
            Declaro que tive acesso, li e concordo com os{" "}
            <a href="/termos" target="_blank" rel="noopener noreferrer">
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a href="/privacidade" target="_blank" rel="noopener noreferrer">
              Política de Privacidade
            </a>{" "}
            da Praesentia.
          </span>
        </label>

        {error ? <p className="public-rsvp-error">{error}</p> : null}

        <div className="public-rsvp-actions">
          <button
            className="btn public-rsvp-action"
            type="button"
            disabled={pending}
            onClick={() => (capsuleAvailable ? setStep("capsule") : handleSubmit("confirmed"))}
          >
            {pending ? "Enviando..." : "Confirmar presença"}
          </button>
          <button className="btn secondary public-rsvp-action" type="button" disabled={pending} onClick={() => handleSubmit("declined")}>
            Não vou
          </button>
        </div>
      </div>
    </section>
  );
}

function StepBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 99,
        border: "1.5px solid var(--line-2)",
        background: "#fff",
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
        color: "var(--ink-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600
      }}
    >
      {children}
    </button>
  );
}
