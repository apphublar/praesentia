"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Event, UserSubscription } from "@/types/domain";

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
      <article className="card" style={{ padding: 22, marginBottom: 24, background: "var(--bg-soft)" }}>
        <span className="pill" style={{ background: "var(--green)", color: "#fff" }}>cápsula ativa</span>
        <h2 className="display" style={{ fontSize: 26, margin: "12px 0 8px" }}>
          Plano {event.plan.label}
        </h2>
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
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

      const res = await fetch(`/api/billing/activate-capsule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
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

  const plusSlotsLeft = subscription
    ? Math.max(0, 6 - subscription.eventsUsedThisPeriod)
    : 6;

  return (
    <article className="card" style={{ padding: 22, marginBottom: 24, borderColor: "var(--coral)" }}>
      <span className="pill">ativar cápsula</span>
      <h2 className="display" style={{ fontSize: 26, margin: "12px 0 8px" }}>
        Libere mural ao vivo e memória permanente
      </h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.55, marginBottom: 18 }}>
        No plano gratuito você já tem convite, RSVP e lista de presença. Para transformar este link em mural ao vivo
        e cápsula do tempo, escolha uma opção abaixo.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <strong className="display" style={{ fontSize: 22 }}>Cápsula</strong>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5 }}>R$59 · pagamento único · 1 evento · 5 GB</p>
          <button type="button" className="btn" style={{ marginTop: 12, width: "100%" }} disabled={loading !== null} onClick={() => activate("capsule")}>
            {loading === "capsule" ? "Ativando..." : "Ativar Cápsula (R$59)"}
          </button>
        </div>
        <div className="card" style={{ padding: 18, background: "var(--bg-soft)" }}>
          <strong className="display" style={{ fontSize: 22 }}>Cápsula Plus</strong>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.5 }}>
            R$197/ano · até 6 eventos · 20 GB compartilhados
            {subscription && ` · ${plusSlotsLeft} vaga${plusSlotsLeft !== 1 ? "s" : ""} restante${plusSlotsLeft !== 1 ? "s" : ""}`}
          </p>
          <button type="button" className="btn secondary" style={{ marginTop: 12, width: "100%" }} disabled={loading !== null} onClick={() => activate("family")}>
            {loading === "plus" ? "Ativando..." : subscription ? "Usar vaga do Plus" : "Ativar Plus (R$197/ano)"}
          </button>
        </div>
      </div>

      <p style={{ color: "var(--ink-soft)", fontSize: 12, marginTop: 14 }}>
        Pagamento simulado em desenvolvimento. Em produção, Stripe confirmará o pagamento antes de liberar.
      </p>
      {message && <p style={{ color: "var(--green)", fontSize: 13, marginTop: 8 }}>{message}</p>}
    </article>
  );
}
