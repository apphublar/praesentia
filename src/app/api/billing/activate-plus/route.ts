import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { requireSession } from "@/lib/auth/session";
import { resolveBillingAction } from "@/lib/billing/billing-action";
import { fulfillPlusSubscription } from "@/lib/billing/fulfill-checkout";
import { assertTrustedOrigin } from "@/lib/security/origin";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { repositories } = await import("@/lib/db");
    const existing = await repositories.subscriptions.findActiveByUser(session.user.id);
    if (existing) {
      return NextResponse.json({
        mode: "fulfilled",
        subscription: existing,
        message: "Assinatura já ativa."
      });
    }

    const resolution = await resolveBillingAction({
      checkout: {
        kind: "plus",
        userId: session.user.id,
        userEmail: session.user.email
      },
      fulfill: () => fulfillPlusSubscription(session.user.id)
    });

    if (resolution.mode === "checkout") {
      return NextResponse.json({ mode: "checkout", checkoutUrl: resolution.checkoutUrl });
    }
    if (resolution.mode === "unavailable") {
      return NextResponse.json({ error: resolution.error }, { status: 503 });
    }

    const subscription = resolution.result;
    return NextResponse.json({
      mode: "fulfilled",
      subscription,
      message: "Cápsula Plus ativada por 12 meses."
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[activate-plus]", err);
    return NextResponse.json({ error: "Erro ao ativar assinatura." }, { status: 500 });
  }
}
