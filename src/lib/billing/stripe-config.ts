export type CheckoutKind =
  | "capsule"
  | "plus"
  | "storage"
  | "ai_invite_plan"
  | "album";

export type CheckoutMetadata = {
  kind: CheckoutKind;
  userId: string;
  eventId?: string;
  plan?: string;
  gb?: string;
  orderId?: string;
  pageCount?: string;
  totalCents?: string;
};

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Em produção, billing simulado só é permitido se Stripe não estiver configurado (não recomendado). */
export function canBypassBilling() {
  if (isStripeConfigured()) return false;
  return process.env.APP_ENV !== "production";
}

export function billingNotConfiguredMessage() {
  return "Pagamentos online ainda não estão disponíveis. Tente novamente em breve ou entre em contato com o suporte.";
}

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function stripePriceIdForKind(input: {
  kind: CheckoutKind;
  plan?: string;
  gb?: number;
}): string | null {
  switch (input.kind) {
    case "capsule":
      return process.env.STRIPE_PRICE_CAPSULE?.trim() || null;
    case "plus":
      return process.env.STRIPE_PRICE_PLUS_YEARLY?.trim() || null;
    case "storage":
      if (input.gb === 5) return process.env.STRIPE_PRICE_STORAGE_5GB?.trim() || null;
      if (input.gb === 10) return process.env.STRIPE_PRICE_STORAGE_10GB?.trim() || null;
      if (input.gb === 25) return process.env.STRIPE_PRICE_STORAGE_25GB?.trim() || null;
      if (input.gb === 50) return process.env.STRIPE_PRICE_STORAGE_50GB?.trim() || null;
      return null;
    case "ai_invite_plan":
      if (input.plan === "inspiracao") return process.env.STRIPE_PRICE_AI_INSPIRACAO?.trim() || null;
      if (input.plan === "criativo") return process.env.STRIPE_PRICE_AI_CRIATIVO?.trim() || null;
      return null;
    default:
      return null;
  }
}
