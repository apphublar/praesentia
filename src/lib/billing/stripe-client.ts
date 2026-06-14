import Stripe from "stripe";
import { isStripeConfigured } from "@/lib/billing/stripe-config";

let client: Stripe | null = null;

export function getStripeClient() {
  if (!isStripeConfigured()) return null;
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return client;
}
