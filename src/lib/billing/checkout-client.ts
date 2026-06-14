/** Trata resposta unificada das rotas de billing (Stripe ou bypass dev). */
export function handleBillingApiResponse(data: Record<string, unknown>): {
  ok: boolean;
  error?: string;
  redirected?: boolean;
} {
  if (typeof data.checkoutUrl === "string" && data.mode === "checkout") {
    window.location.assign(data.checkoutUrl);
    return { ok: true, redirected: true };
  }
  if (data.mode === "fulfilled" || data.message || data.quota || data.event || data.subscription) {
    return { ok: true };
  }
  return { ok: false, error: String(data.error ?? "Não foi possível concluir.") };
}
