import { NextResponse } from "next/server";
import { BillingFulfillmentError, fulfillCheckoutMetadata, parseCheckoutMetadata } from "@/lib/billing/fulfill-checkout";
import { getStripeClient } from "@/lib/billing/stripe-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook Stripe não configurado." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const body = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] assinatura inválida", err);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      // Boleto/PIX: completed chega antes do pagamento; async_payment_succeeded confirma de fato.
      if (
        event.type === "checkout.session.completed" &&
        session.payment_status !== "paid" &&
        session.payment_status !== "no_payment_required"
      ) {
        return NextResponse.json({ received: true });
      }
      const metadata = parseCheckoutMetadata(session.metadata ?? {});
      if (!metadata) {
        console.warn("[stripe-webhook] metadata ausente", session.id);
        return NextResponse.json({ received: true });
      }
      await fulfillCheckoutMetadata(metadata);
    }
  } catch (err) {
    if (err instanceof BillingFulfillmentError) {
      console.error("[stripe-webhook] fulfillment", err.message);
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: "Falha ao processar webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
