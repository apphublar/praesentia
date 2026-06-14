import { trackEvent } from "@/lib/analytics/track-event";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import { handleBillingApiResponse } from "@/lib/billing/checkout-client";
import { AI_INVITE_UPGRADE_PLANS, type AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";

export type CheckoutSource = "after_free_generation" | "retry_without_pack";

export async function openCheckout(
  plan: AiInviteUpgradePlan,
  eventId: string,
  source: CheckoutSource = "after_free_generation"
): Promise<{ quota?: CoverQuota; error?: string; redirected?: boolean }> {
  trackEvent("invitation_ai_upgrade", { plan, source });

  try {
    const { response, data } = await dashboardFetchJson("/api/billing/purchase-ai-invite-plan", {
      method: "POST",
      body: JSON.stringify({ eventId, plan })
    });

    if (!response.ok) {
      return { error: String(data.error ?? "Não foi possível concluir a compra agora.") };
    }

    const handled = handleBillingApiResponse(data as Record<string, unknown>);
    if (handled.redirected) return { redirected: true };
    if (!handled.ok) return { error: handled.error };

    return { quota: data.quota as CoverQuota | undefined };
  } catch (err) {
    return { error: apiErrorMessage(err, "Erro de conexão. Tente novamente.") };
  }
}

export function formatInvitePlanVersions(plan: AiInviteUpgradePlan) {
  return AI_INVITE_UPGRADE_PLANS[plan].versions;
}
