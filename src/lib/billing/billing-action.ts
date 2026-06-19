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
  orderId?: string;
  pageCount?: number;
  totalCents?: number;
};

export async function createAlbumCheckoutSession(input: {
  userId: string;
  userEmail?: string;
  eventId: string;
  orderId: string;
  pageCount: number;
  totalCents: number;
}) {
  const stripe = getStripeClient();
  if (!stripe) return null;

  const base = appBaseUrl();
  const successUrl = `${base}/dashboard/eventos/${input.eventId}/album?checkout=success`;
  const cancelUrl = `${base}/dashboard/eventos/${input.eventId}/album?checkout=cancelled`;

  const metadata: Record<string, string> = {
    kind: "album",
    userId: input.userId,
    eventId: input.eventId,
    orderId: input.orderId,
    pageCount: String(input.pageCount),
    totalCents: String(input.totalCents)
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.userEmail || undefined,
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: "Álbum de Fotos Praesentia",
            description: `${input.pageCount} páginas · 30×30 cm · capa dura`
          },
          unit_amount: input.totalCents
        },
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata
  });

  if (!session.url) throw new Error("Stripe não retornou URL de checkout.");
  return session.url;
}

export async function createStripeCheckoutSession(input: CreateCheckoutInput) {
  if (input.kind === "album") {
    if (!input.eventId || !input.orderId || input.pageCount == null || input.totalCents == null) {
      throw new Error("Dados do álbum incompletos para checkout.");
    }
    return createAlbumCheckoutSession({
      userId: input.userId,
      userEmail: input.userEmail,
      eventId: input.eventId,
      orderId: input.orderId,
      pageCount: input.pageCount,
      totalCents: input.totalCents
    });
  }

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
  if (input.orderId) metadata.orderId = input.orderId;
  if (input.pageCount != null) metadata.pageCount = String(input.pageCount);
  if (input.totalCents != null) metadata.totalCents = String(input.totalCents);

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
