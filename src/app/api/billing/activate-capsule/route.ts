import { NextResponse } from "next/server";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { assertTrustedOrigin } from "@/lib/security/origin";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));
    const plan = body.plan === "family" ? "family" : "capsule";

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const membership = await repositories.members.findMembership(eventId, session.user.id);
    if (!canManageEvent(session.user, membership ?? undefined)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Este evento já possui cápsula ativa." }, { status: 409 });
    }

    if (plan === "family") {
      const subscription = await repositories.subscriptions.findActiveByUser(session.user.id);
      if (!subscription) {
        return NextResponse.json({ error: "Assinatura Cápsula Plus não encontrada." }, { status: 402 });
      }
      const limit = PLANS.family.yearlyEventLimit ?? 6;
      if (subscription.eventsUsedThisPeriod >= limit) {
        return NextResponse.json({ error: `Limite de ${limit} eventos no período anual atingido.` }, { status: 403 });
      }
      await repositories.subscriptions.consumeEventSlot(session.user.id);
      await repositories.events.activateCapsule(eventId, session.user.id, "family");
    } else {
      await repositories.events.activateCapsule(eventId, session.user.id, "capsule");
    }

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "event.capsule_activated",
      targetType: "event",
      targetId: eventId,
      metadata: { plan, devMode: process.env.NODE_ENV !== "production" }
    });

    const updated = await repositories.events.findById(eventId);
    return NextResponse.json({ event: updated, message: "Cápsula ativada com sucesso." });
  } catch (err) {
    console.error("[activate-capsule]", err);
    return NextResponse.json({ error: "Erro ao ativar cápsula." }, { status: 500 });
  }
}
