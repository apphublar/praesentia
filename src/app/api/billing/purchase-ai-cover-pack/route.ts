import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import {
  AI_COVER_PACK_BONUS_EDITS,
  AI_COVER_PACK_BONUS_GENERATIONS,
  AI_COVER_PACK_DESCRIPTION,
  AI_COVER_PACK_PRICE_LABEL
} from "@/lib/plans/ai-cover-pack";
import { getAiCoverQuota, hasCapsuleAccess } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const eventId = sanitizeText(body.eventId, 80);

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    if (hasCapsuleAccess(event)) {
      return NextResponse.json(
        { error: "O pacote extra de convite IA é só para eventos no plano gratuito." },
        { status: 400 }
      );
    }

    const updated = await repositories.events.purchaseAiCoverPack(eventId, session.user.id);

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "event.ai_cover_pack_purchased",
      targetType: "event",
      targetId: eventId,
      metadata: {
        priceLabel: AI_COVER_PACK_PRICE_LABEL,
        bonusGenerations: AI_COVER_PACK_BONUS_GENERATIONS,
        bonusEdits: AI_COVER_PACK_BONUS_EDITS,
        devMode: process.env.NODE_ENV !== "production"
      }
    });

    return NextResponse.json({
      event: updated,
      message: `Pacote ativado (${AI_COVER_PACK_PRICE_LABEL}). ${AI_COVER_PACK_DESCRIPTION}`,
      quota: getAiCoverQuota(updated)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    const detail = err instanceof Error ? err.message : "";
    if (/ai_cover_pack_bonus/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado: execute a migração 009-ai-cover-pack.sql no Supabase." },
        { status: 503 }
      );
    }
    console.error("[purchase-ai-cover-pack]", err);
    return NextResponse.json({ error: "Erro ao ativar pacote de convite IA." }, { status: 500 });
  }
}
