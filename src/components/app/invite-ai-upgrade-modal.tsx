"use client";

import { useState } from "react";
import { Icon } from "@/components/app/ui/icon";
import { openCheckout, type CheckoutSource } from "@/lib/billing/open-checkout";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import { AI_INVITE_UPGRADE_PLANS, type AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";

export function InviteAiUpgradeModal({
  open,
  eventId,
  source = "after_free_generation",
  onClose,
  onPurchased
}: {
  open: boolean;
  eventId: string;
  source?: CheckoutSource;
  onClose: () => void;
  onPurchased: (quota: CoverQuota) => void;
}) {
  const [loadingPlan, setLoadingPlan] = useState<AiInviteUpgradePlan | null>(null);
  const [error, setError] = useState("");

  if (!open) return null;

  async function handleCheckout(plan: AiInviteUpgradePlan) {
    setLoadingPlan(plan);
    setError("");
    const result = await openCheckout(plan, eventId, source);
    setLoadingPlan(null);
    if (result.redirected) return;
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.quota) onPurchased(result.quota);
    onClose();
  }

  return (
    <div className="invite-ai-upgrade-backdrop" role="dialog" aria-modal="true" aria-labelledby="invite-ai-upgrade-title">
      <div className="invite-ai-upgrade-modal">
        <button type="button" className="invite-ai-upgrade-close" onClick={onClose} aria-label="Fechar">
          <Icon name="x" size={18} />
        </button>

        <h2 id="invite-ai-upgrade-title" className="display-i invite-ai-upgrade-headline">
          Gostou da ideia?
        </h2>
        <p className="invite-ai-upgrade-sub">
          Crie novas versões e encontre o convite perfeito para o seu momento.
        </p>
        <p className="invite-ai-upgrade-detail">
          Cada tentativa criativa explora novos estilos, composições, cores e detalhes para tornar seu convite único.
        </p>

        <div className="invite-ai-upgrade-grid">
          <article className="invite-ai-upgrade-card is-disabled">
            <div className="invite-ai-upgrade-card-head">
              <strong>{AI_INVITE_UPGRADE_PLANS.gratuito.name}</strong>
              <span>{AI_INVITE_UPGRADE_PLANS.gratuito.tagline}</span>
            </div>
            <ul>
              <li>✓ 1 versão de convite IA</li>
            </ul>
            <div className="invite-ai-upgrade-price">{AI_INVITE_UPGRADE_PLANS.gratuito.priceLabel}</div>
            <button type="button" className="btn btn-ghost" disabled>
              Versão utilizada
            </button>
          </article>

          <article className="invite-ai-upgrade-card is-popular">
            <span className="invite-ai-upgrade-badge">Mais Popular</span>
            <div className="invite-ai-upgrade-card-head">
              <strong>{AI_INVITE_UPGRADE_PLANS.inspiracao.name}</strong>
              <span>{AI_INVITE_UPGRADE_PLANS.inspiracao.tagline}</span>
            </div>
            <ul>
              <li>✓ 5 versões de convite IA</li>
            </ul>
            <div className="invite-ai-upgrade-price">{AI_INVITE_UPGRADE_PLANS.inspiracao.priceLabel}</div>
            <button
              type="button"
              className="btn btn-coral"
              disabled={Boolean(loadingPlan)}
              onClick={() => handleCheckout("inspiracao")}
            >
              {loadingPlan === "inspiracao" ? "Ativando…" : AI_INVITE_UPGRADE_PLANS.inspiracao.cta}
            </button>
          </article>

          <article className="invite-ai-upgrade-card">
            <div className="invite-ai-upgrade-card-head">
              <strong>{AI_INVITE_UPGRADE_PLANS.criativo.name}</strong>
              <span>{AI_INVITE_UPGRADE_PLANS.criativo.tagline}</span>
            </div>
            <ul>
              <li>✓ 15 versões de convite IA</li>
            </ul>
            <div className="invite-ai-upgrade-price">{AI_INVITE_UPGRADE_PLANS.criativo.priceLabel}</div>
            <button
              type="button"
              className="btn btn-dark"
              disabled={Boolean(loadingPlan)}
              onClick={() => handleCheckout("criativo")}
            >
              {loadingPlan === "criativo" ? "Ativando…" : AI_INVITE_UPGRADE_PLANS.criativo.cta}
            </button>
          </article>
        </div>

        <p className="invite-ai-upgrade-emotional">
          Seu evento acontece uma única vez. Vale a pena dedicar alguns minutos para encontrar um convite que represente exatamente esse momento.
        </p>

        {error ? <p className="invite-ai-upgrade-error">{error}</p> : null}
      </div>
    </div>
  );
}
