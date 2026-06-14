import type { CheckoutKind } from "@/lib/billing/stripe-config";
import {
  appBaseUrl,
  billingNotConfiguredMessage,
  canBypassBilling,
  isStripeConfigured,
  stripePriceIdForKind
} from "@/lib/billing/stripe-config";
import { getStripeClient } from "@/lib/billing/stripe-client";

export type CreateCheckoutInput = {
  kind: CheckoutKind;
  userId: string;
  userEmail?: string;
  eventId?: string;
  plan?: string;
  gb?: number;
};

export async function createStripeCheckoutSession(input: CreateCheckoutInput) {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const priceId = stripePriceIdForKind({
    kind: input.kind,
    plan: input.plan,
    gb: input.gb
  });
  if (!priceId) {
    throw new Error(`Price ID Stripe não configurado para ${input.kind}.`);
  }

  const base = appBaseUrl();
  const successUrl = `${base}/dashboard/pagamentos?checkout=success`;
  const cancelUrl = input.eventId
    ? `${base}/dashboard/eventos/${input.eventId}?checkout=cancelled`
    : `${base}/dashboard?checkout=cancelled`;

  const metadata: Record<string, string> = {
    kind: input.kind,
    userId: input.userId
  };
  if (input.eventId) metadata.eventId = input.eventId;
  if (input.plan) metadata.plan = input.plan;
  if (input.gb != null) metadata.gb = String(input.gb);

  const mode = input.kind === "plus" ? "subscription" : "payment";

  const session = await stripe.checkout.sessions.create({
    mode,
    customer_email: input.userEmail || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: mode === "subscription" ? { metadata } : undefined
  });

  if (!session.url) throw new Error("Stripe não retornou URL de checkout.");
  return session.url;
}

export type BillingResolution =
  | { mode: "checkout"; checkoutUrl: string }
  | { mode: "fulfilled"; result: unknown }
  | { mode: "unavailable"; error: string };

export async function resolveBillingAction(input: {
  checkout: CreateCheckoutInput;
  fulfill: () => Promise<unknown>;
}): Promise<BillingResolution> {
  if (isStripeConfigured()) {
    try {
      const checkoutUrl = await createStripeCheckoutSession(input.checkout);
      if (checkoutUrl) return { mode: "checkout", checkoutUrl };
    } catch (err) {
      console.error("[billing] stripe checkout", err);
      return { mode: "unavailable", error: "Não foi possível iniciar o pagamento. Tente novamente." };
    }
  }

  if (!canBypassBilling()) {
    return { mode: "unavailable", error: billingNotConfiguredMessage() };
  }

  const result = await input.fulfill();
  return { mode: "fulfilled", result };
}

export function redirectToCheckout(checkoutUrl: string) {
  if (typeof window === "undefined") return;
  window.location.assign(checkoutUrl);
}
