import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/origin";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const existing = await repositories.subscriptions.findActiveByUser(session.user.id);
    if (existing) {
      return NextResponse.json({ subscription: existing, message: "Assinatura já ativa." });
    }

    const subscription = await repositories.subscriptions.activateFamilyPlan(session.user.id);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId: null,
      action: "subscription.activated",
      targetType: "subscription",
      targetId: subscription.id,
      metadata: { plan: "family", devMode: process.env.NODE_ENV !== "production" }
    });

    return NextResponse.json({ subscription, message: "Cápsula Plus ativada por 12 meses." });
  } catch (err) {
    console.error("[activate-plus]", err);
    return NextResponse.json({ error: "Erro ao ativar assinatura." }, { status: 500 });
  }
}
