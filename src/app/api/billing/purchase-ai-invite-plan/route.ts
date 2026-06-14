import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { AI_INVITE_UPGRADE_PLANS, type AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";
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
    const plan = sanitizeText(body.plan, 20) as AiInviteUpgradePlan;

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }

    if (plan !== "inspiracao" && plan !== "criativo") {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    if (hasCapsuleAccess(event)) {
      return NextResponse.json(
        { error: "Pacotes de versões extras são para eventos no plano gratuito." },
        { status: 400 }
      );
    }

    const planInfo = AI_INVITE_UPGRADE_PLANS[plan];
    await repositories.users.purchaseAiInvitePlan(session.user.id, plan);

    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "event.ai_invite_plan_purchased",
      targetType: "user",
      targetId: session.user.id,
      metadata: {
        plan,
        priceLabel: planInfo.priceLabel,
        priceBrl: planInfo.priceBrl,
        versions: planInfo.versions,
        devMode: process.env.NODE_ENV !== "production"
      }
    });

    const account = await loadAiCoverAccountContext(session.user.id);
    return NextResponse.json({
      message: `${planInfo.versions} versões adicionadas à sua conta.`,
      quota: getAiCoverQuota(event, account)
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    const detail = err instanceof Error ? err.message : "";
    if (/ai_invite_pool/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado: execute a migração 013-user-ai-invite-pool.sql no Supabase." },
        { status: 503 }
      );
    }
    console.error("[purchase-ai-invite-plan]", err);
    return NextResponse.json({ error: "Erro ao ativar pacote de versões." }, { status: 500 });
  }
}
