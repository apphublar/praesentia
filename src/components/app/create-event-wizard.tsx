"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { Event, InviteCopy, UserSubscription } from "@/types/domain";
import { createEventAction } from "@/app/criar/actions";
import { createEventFieldErrorMessage, type CreateEventState } from "@/app/criar/create-event-state";
import { CreateEventPronto } from "@/components/app/create/create-event-pronto";
import { CREATE_PLANS, PlanCard, type PlanId } from "@/components/app/plans/plan-cards";
import { Icon, type IconName } from "@/components/app/ui/icon";
import { Field, Mono, Segmented } from "@/components/app/ui/primitives";
import { validateInviteCopyForContinue } from "@/lib/events/invite-text-validation";
import { handleBillingApiResponse } from "@/lib/billing/checkout-client";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import type { TextQuota } from "@/components/dashboard/invite-text-editor";
import type { EventType } from "@/types/domain";

const STEPS = ["Detalhes", "Convite", "Plano", "Pronto"] as const;

const InviteArtStep = dynamic(
  () => import("@/components/app/create/invite-art-step").then((mod) => ({ default: mod.InviteArtStep })),
  {
    loading: () => <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>Carregando editor do convite…</p>
  }
);

const CREATE_TYPES: { label: string; value: EventType; icon: IconName }[] = [
  { label: "Aniversário", value: "aniversario", icon: "gift" },
  { label: "Casamento", value: "casamento", icon: "heart" },
  { label: "Chá de bebê", value: "cha_fraldas", icon: "spark" },
  { label: "Formatura", value: "formatura", icon: "check" },
  { label: "Batizado", value: "batizado", icon: "spark" },
  { label: "Outro", value: "outros", icon: "plus" }
];

type LocMode = "presencial" | "tbd" | "online";

function StepRail({ step, maxStep, onGo }: { step: number; maxStep: number; onGo: (i: number) => void }) {
  return (
    <div className="app-create-rail">
      <Mono style={{ marginBottom: 22 }}>Novo evento</Mono>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const on = i === step;
          return (
            <button
              key={s}
              type="button"
              onClick={() => i <= maxStep && onGo(i)}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: on ? "var(--card)" : "transparent",
                border: "none",
                borderRadius: 12,
                padding: "11px 12px",
                cursor: i <= maxStep ? "pointer" : "default",
                textAlign: "left",
                boxShadow: on ? "var(--shadow-card)" : "none",
                transition: "all .15s"
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 99,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 700,
                  background: done ? "var(--ink)" : on ? "var(--coral)" : "transparent",
                  color: done || on ? "#fff" : "var(--faint)",
                  border: done || on ? "none" : "1.5px solid var(--line-2)"
                }}
              >
                {done ? <Icon name="check" size={14} sw={2.4} /> : i + 1}
              </span>
              <span style={{ fontWeight: on ? 700 : 500, fontSize: 14, color: on ? "var(--ink)" : "var(--muted)" }}>{s}</span>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: "auto" }}>
        <div className="card-flat" style={{ padding: 14, background: "var(--card)" }}>
          <Mono style={{ fontSize: 9 }}>Dica</Mono>
          <p style={{ margin: "7px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--ink-2)" }}>
            Você pode editar tudo depois no painel do evento — nada aqui é definitivo.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CreateEventWizard({
  initialEvent,
  textQuota,
  coverQuota,
  subscription
}: {
  initialEvent?: Event;
  textQuota?: TextQuota;
  coverQuota?: CoverQuota;
  subscription?: UserSubscription | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEventAction, null);
  const [step, setStep] = useState(initialEvent ? 1 : 0);
  const [maxStep, setMaxStep] = useState(initialEvent ? 3 : 0);

  const [eventType, setEventType] = useState<EventType>("aniversario");
  const [locMode, setLocMode] = useState<LocMode>("presencial");
  const [form, setForm] = useState({
    title: "",
    honoree: "",
    theme: "",
    date: "",
    time: "16:00",
    endTime: "20:00",
    place: "",
    address: "",
    city: "",
    host: "",
    online: ""
  });
  const setF = (k: keyof typeof form, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const ev = initialEvent;
  const [copy, setCopy] = useState<InviteCopy | undefined>(initialEvent?.inviteCopy);
  const [coverUrl, setCoverUrl] = useState(initialEvent?.coverImageUrl ?? "");
  const [continueError, setContinueError] = useState("");
  const [plan, setPlan] = useState<PlanId>("cap");
  const [planLoading, setPlanLoading] = useState<"capsule" | "plus" | null>(null);
  const [planMessage, setPlanMessage] = useState("");

  const actionError = state?.error ?? createEventFieldErrorMessage(state?.fieldError) ?? "";

  useEffect(() => {
    if (state?.eventId) {
      setMaxStep(3);
      router.replace(`/dashboard/criar/continuar/${state.eventId}`);
    }
  }, [state?.eventId, router]);

  useEffect(() => {
    document.querySelector(".app-create-layout .scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function next() {
    if (step === 1) {
      const validation = validateInviteCopyForContinue(copy);
      if (!validation.ok && !copy?.message?.trim()) {
        setContinueError("Gere ou escreva o texto do convite antes de continuar.");
        return;
      }
      setContinueError("");
    }
    setMaxStep(Math.max(maxStep, step + 1));
    setStep(Math.min(3, step + 1));
  }

  function back() {
    setStep(Math.max(0, step - 1));
  }

  async function activateSelectedPlan() {
    if (!ev || plan === "free") {
      next();
      return;
    }
    setPlanLoading(plan === "plus" ? "plus" : "capsule");
    setPlanMessage("");
    try {
      if (plan === "plus" && !subscription) {
        const plusRes = await fetch("/api/billing/activate-plus", { method: "POST" });
        const plusData = await plusRes.json();
        const plusHandled = handleBillingApiResponse(plusData as Record<string, unknown>);
        if (plusHandled.redirected) return;
        if (!plusRes.ok || !plusHandled.ok) {
          setPlanMessage(plusHandled.error ?? String(plusData.error ?? "Erro ao ativar Cápsula Plus."));
          return;
        }
      }
      const res = await fetch("/api/billing/activate-capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: ev.id, plan: plan === "plus" ? "family" : "capsule" })
      });
      const data = await res.json();
      const handled = handleBillingApiResponse(data as Record<string, unknown>);
      if (handled.redirected) return;
      if (!res.ok || !handled.ok) {
        setPlanMessage(handled.error ?? String(data.error ?? "Erro ao ativar cápsula."));
        return;
      }
      setPlanMessage(String(data.message ?? "Plano ativado!"));
      next();
    } catch {
      setPlanMessage("Erro de conexão.");
    } finally {
      setPlanLoading(null);
    }
  }

  return (
    <div className="app-create-layout">
      <StepRail step={step} maxStep={maxStep} onGo={setStep} />
      <div className="scroll" style={{ flex: 1, overflow: "auto", padding: "36px 48px 60px" }}>
        <div style={{ maxWidth: step === 1 || step === 2 || step === 3 ? 920 : 680, margin: "0 auto" }} key={step} className="fadeUp">
          {step === 0 && (
            <>
              <h1 className="display" style={{ fontSize: 38, marginBottom: 6 }}>
                Conte sobre o <span className="coral">momento</span>.
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 26px" }}>O básico para montar o convite. Leva um minuto.</p>
              <Mono style={{ display: "block", marginBottom: 10 }}>Tipo de evento</Mono>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 26 }}>
                {CREATE_TYPES.map((t) => {
                  const on = eventType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setEventType(t.value)}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "10px 15px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontFamily: "var(--font-sans)",
                        fontWeight: 600,
                        fontSize: 13.5,
                        background: on ? "var(--ink)" : "var(--card)",
                        color: on ? "var(--paper)" : "var(--ink-2)",
                        border: `1.5px solid ${on ? "var(--ink)" : "var(--line-2)"}`
                      }}
                    >
                      <Icon name={t.icon} size={15} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <form action={formAction} className="app-create-grid">
                <input type="hidden" name="eventType" value={eventType} />
                <input type="hidden" name="eventFormat" value={locMode === "online" ? "online" : "in_person"} />
                <input type="hidden" name="locationMode" value={locMode === "tbd" ? "tbd" : ""} />
                <input type="hidden" name="startsAt" value={form.time} />
                <input type="hidden" name="endsAt" value={form.endTime} />
                <input type="hidden" name="theme" value={form.theme || "Celebração"} />
                <Field label="Nome do evento" span={2}>
                  <input className="input" name="title" required value={form.title} onChange={(e) => setF("title", e.target.value)} />
                </Field>
                <Field label="Homenageado(a)">
                  <input className="input" name="hostName" required value={form.honoree} onChange={(e) => setF("honoree", e.target.value)} />
                </Field>
                <Field label="Tema (opcional)">
                  <input className="input" value={form.theme} onChange={(e) => setF("theme", e.target.value)} />
                </Field>
                <Field label="Data">
                  <input type="date" className="input" name="date" required value={form.date} onChange={(e) => setF("date", e.target.value)} />
                </Field>
                <Field label="Horário">
                  <input type="time" className="input" required value={form.time} onChange={(e) => setF("time", e.target.value)} />
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <span className="fl">Onde vai ser</span>
                  <Segmented
                    full
                    options={[
                      { v: "presencial" as LocMode, l: "Presencial" },
                      { v: "tbd" as LocMode, l: "A definir" },
                      { v: "online" as LocMode, l: "Online" }
                    ]}
                    value={locMode}
                    onChange={setLocMode}
                  />
                  {locMode === "presencial" && (
                    <div className="app-create-grid" style={{ marginTop: 12 }}>
                      <input className="input" name="venueName" required placeholder="Local" value={form.place} onChange={(e) => setF("place", e.target.value)} />
                      <input className="input" name="venueAddress" required placeholder="Endereço" value={form.address} onChange={(e) => setF("address", e.target.value)} />
                      <input className="input" name="city" required placeholder="Cidade" value={form.city} onChange={(e) => setF("city", e.target.value)} style={{ gridColumn: "1 / -1" }} />
                    </div>
                  )}
                  {locMode === "tbd" && (
                    <>
                      <input type="hidden" name="venueName" value="Local a definir" />
                      <input type="hidden" name="venueAddress" value="A definir" />
                      <input type="hidden" name="city" value={form.city || "A definir"} />
                    </>
                  )}
                  {locMode === "online" && (
                    <input className="input" name="onlineMeetingUrl" required placeholder="Link do evento online" value={form.online} onChange={(e) => setF("online", e.target.value)} style={{ marginTop: 12 }} />
                  )}
                </div>
                <Field label="Organizador(a)" span={2}>
                  <input className="input" name="organizerName" required value={form.host} onChange={(e) => setF("host", e.target.value)} />
                </Field>
                <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <button type="submit" className="btn btn-coral" disabled={pending}>
                    {pending ? "Salvando…" : "Continuar para o convite →"}
                  </button>
                  {actionError ? <p style={{ color: "var(--coral-deep)", fontSize: 13, marginTop: 10 }}>{actionError}</p> : null}
                </div>
              </form>
            </>
          )}

          {step === 1 && ev && textQuota && coverQuota && (
            <>
              <h1 className="display" style={{ fontSize: 38, marginBottom: 6 }}>
                Crie o <span className="coral">convite</span>.
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 24px" }}>Gere a arte com IA ou envie a imagem que você já criou — e escreva o texto que vai com o link.</p>
              <InviteArtStep event={ev} textQuota={textQuota} coverQuota={coverQuota} onCoverChange={setCoverUrl} onCopyChange={setCopy} />
              {continueError ? <p style={{ color: "var(--coral-deep)", marginTop: 16 }}>{continueError}</p> : null}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="display" style={{ fontSize: 38, marginBottom: 6 }}>
                Escolha o <span className="coral">plano</span>.
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 30px" }}>
                Comece grátis. A Cápsula pode ser ativada em <strong>pagamento único</strong> ou no <strong>plano anual</strong>, a qualquer momento antes do fim do evento.
              </p>
              <div className="create-plan-grid">
                {CREATE_PLANS.map((p) => (
                  <PlanCard key={p.id} plan={p} selected={plan === p.id} onSelect={() => setPlan(p.id)} />
                ))}
              </div>
              <div className="card-flat" style={{ marginTop: 18, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center", background: "var(--card-2)" }}>
                <Icon name="hourglass" size={18} style={{ color: "var(--coral)", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)" }}>
                  <strong>A Cápsula não pode ser ativada depois do evento.</strong> Sem ela, o link para de funcionar quando a festa acaba.
                </p>
              </div>
              {planMessage ? <p style={{ marginTop: 14, color: "var(--coral-deep)" }}>{planMessage}</p> : null}
            </>
          )}

          {step === 3 && ev && (
            <CreateEventPronto event={ev} inviteCopy={copy} coverUrl={coverUrl || ev.coverImageUrl || undefined} plan={plan} />
          )}
        </div>

        {step < 3 && step > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 34, borderTop: "1px solid var(--line)", paddingTop: 22, maxWidth: step === 1 || step === 2 ? 920 : 680, margin: "34px auto 0" }}>
            <button type="button" className="btn btn-ghost" onClick={back}>
              <Icon name="arrowL" size={15} />
              Voltar
            </button>
            {step === 2 ? (
              <button type="button" className="btn btn-coral" onClick={activateSelectedPlan} disabled={planLoading !== null}>
                {planLoading ? "Processando…" : plan === "free" ? "Finalizar" : "Continuar"}
                <Icon name="arrowR" size={15} />
              </button>
            ) : (
              <button type="button" className="btn btn-coral" onClick={next}>
                Continuar
                <Icon name="arrowR" size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
