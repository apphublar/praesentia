import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEventEndDate } from "@/lib/events/phase";
import { PLANS } from "@/lib/plans";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const eventId = sanitizeText(body.eventId, 80);
    const plan = body.plan === "family" ? "family" : "capsule";

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Este evento já possui cápsula ativa." }, { status: 409 });
    }

    if (new Date() > getEventEndDate(event)) {
      return NextResponse.json(
        {
          error:
            "Este evento já terminou. A cápsula precisa ser ativada antes do fim do evento para guardar as memórias."
        },
        { status: 403 }
      );
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
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[activate-capsule]", err);
    return NextResponse.json({ error: "Erro ao ativar cápsula." }, { status: 500 });
  }
}
