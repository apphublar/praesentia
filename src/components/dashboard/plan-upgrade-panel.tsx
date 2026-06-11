"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Event, UserSubscription } from "@/types/domain";
import { RETENTION_CAPSULE_DESCRIPTION, RETENTION_FREE_DESCRIPTION, RETENTION_MINIMUM_LABEL } from "@/lib/copy/retention";
import { canActivateCapsuleForEvent } from "@/lib/mural/timeline";

const CAPSULE_FEATURES = [
  "Fotos e recados em tempo real no mural",
  "Telão ao vivo na festa",
  `Cápsula do tempo — ${RETENTION_MINIMUM_LABEL}`,
  "Moderação e bloqueio de convidados"
];

export function PlanUpgradePanel({
  event,
  subscription
}: {
  event: Event;
  subscription: UserSubscription | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"capsule" | "plus" | null>(null);
  const [message, setMessage] = useState("");

  if (event.capsuleActivatedAt) {
    return (
      <article className="card dashboard-card plan-upgrade-panel is-active">
        <span className="pill" style={{ background: "var(--green)", color: "#fff" }}>
          cápsula ativa
        </span>
        <h2 className="display plan-upgrade-title">Plano {event.plan.label}</h2>
        <p className="plan-upgrade-lead">
          Mural ao vivo, telão e cápsula do tempo liberados neste link desde{" "}
          {new Date(event.capsuleActivatedAt).toLocaleDateString("pt-BR")}.
        </p>
      </article>
    );
  }

  async function activate(plan: "capsule" | "family") {
    setLoading(plan === "family" ? "plus" : "capsule");
    setMessage("");
    try {
      if (plan === "family" && !subscription) {
        const plusRes = await fetch("/api/billing/activate-plus", { method: "POST" });
        const plusData = await plusRes.json();
        if (!plusRes.ok) {
          setMessage(plusData.error ?? "Erro ao ativar Cápsula Plus.");
          setLoading(null);
          return;
        }
      }

      const res = await fetch("/api/billing/activate-capsule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, plan })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Erro ao ativar cápsula.");
        setLoading(null);
        return;
      }

      setMessage(data.message ?? "Cápsula ativada!");
      router.refresh();
    } catch {
      setMessage("Erro de conexão.");
    }
    setLoading(null);
  }

  const plusSlotsLeft = subscription ? Math.max(0, 6 - subscription.eventsUsedThisPeriod) : 6;
  const canActivate = canActivateCapsuleForEvent(event);

  if (!canActivate) {
    return (
      <article className="card dashboard-card plan-upgrade-panel">
        <span className="pill">evento encerrado</span>
        <h2 className="display plan-upgrade-title">Cápsula indisponível para este evento</h2>
        <p className="plan-upgrade-lead">{RETENTION_FREE_DESCRIPTION}</p>
      </article>
    );
  }

  return (
    <article className="card dashboard-card plan-upgrade-panel">
      <span className="pill">cápsula · mural · telão</span>
      <h2 className="display plan-upgrade-title">Ative a Cápsula Praesentia</h2>
      <p className="plan-upgrade-lead">
        No plano gratuito você já tem convite, RSVP e lista de presença. Escolha um plano abaixo para liberar mural ao
        vivo, telão e cápsula do tempo neste link.
      </p>
      <p className="plan-upgrade-note">{RETENTION_CAPSULE_DESCRIPTION}</p>

      <ul className="plan-upgrade-features">
        {CAPSULE_FEATURES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="plan-upgrade-grid">
        <div className="plan-upgrade-option">
          <strong className="display plan-upgrade-option-title">Cápsula</strong>
          <p className="plan-upgrade-option-meta">R$59 · pagamento único · 1 evento · 5 GB</p>
          <button
            type="button"
            className="btn plan-upgrade-btn"
            disabled={loading !== null}
            onClick={() => activate("capsule")}
          >
            {loading === "capsule" ? "Ativando..." : "Ativar Cápsula (R$59)"}
          </button>
        </div>
        <div className="plan-upgrade-option plan-upgrade-option-alt">
          <strong className="display plan-upgrade-option-title">Cápsula Plus</strong>
          <p className="plan-upgrade-option-meta">
            R$197/ano · até 6 eventos · 20 GB compartilhados
            {subscription && ` · ${plusSlotsLeft} vaga${plusSlotsLeft !== 1 ? "s" : ""} restante${plusSlotsLeft !== 1 ? "s" : ""}`}
          </p>
          <button
            type="button"
            className="btn secondary plan-upgrade-btn"
            disabled={loading !== null}
            onClick={() => activate("family")}
          >
            {loading === "plus" ? "Ativando..." : subscription ? "Usar vaga do Plus" : "Ativar Plus (R$197/ano)"}
          </button>
        </div>
      </div>

      <p className="plan-upgrade-footnote">
        Enquanto o pagamento online não estiver configurado, o botão ativa a cápsula imediatamente para você testar
        mural, telão e link dos convidados. Com Stripe ativo, a liberação ocorre após confirmação do pagamento.
      </p>
      {message ? <p className="settings-status is-ok">{message}</p> : null}
    </article>
  );
}
