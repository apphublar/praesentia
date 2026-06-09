import { NextResponse } from "next/server";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import {
  EXTRA_STORAGE_PACKAGES_GB,
  getExtraStoragePriceBrl,
  getStorageScope,
  type ExtraStoragePackageGb
} from "@/lib/storage/quota";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const eventId = sanitizeText(body.eventId, 80);
    const gb = Number(body.gb);

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }

    if (!EXTRA_STORAGE_PACKAGES_GB.includes(gb as ExtraStoragePackageGb)) {
      return NextResponse.json({ error: "Pacote de armazenamento inválido." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if (!event.capsuleActivatedAt) {
      return NextResponse.json({ error: "Ative a cápsula antes de expandir o armazenamento." }, { status: 403 });
    }

    const membership = await repositories.members.findMembership(eventId, session.user.id);
    if (!canManageEvent(session.user, membership ?? undefined)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const scope = getStorageScope(event);
    const packageGb = gb as ExtraStoragePackageGb;

    if (scope === "subscription") {
      const subscription = await repositories.subscriptions.findActiveByUser(session.user.id);
      if (!subscription) {
        return NextResponse.json({ error: "Assinatura Cápsula Plus não encontrada." }, { status: 402 });
      }
      const updatedSubscription = await repositories.subscriptions.addExtraStorage(session.user.id, packageGb);
      await repositories.audit.record({
        actorUserId: session.user.id,
        eventId,
        action: "subscription.storage_expanded",
        targetType: "subscription",
        targetId: updatedSubscription.id,
        metadata: { gb: packageGb, priceBrl: getExtraStoragePriceBrl(packageGb), devMode: process.env.NODE_ENV !== "production" }
      });
      return NextResponse.json({
        scope,
        addedGb: packageGb,
        extraStorageGb: updatedSubscription.extraStorageGb,
        message: `+${packageGb} GB adicionados ao pool compartilhado do Cápsula Plus.`
      });
    }

    const updatedEvent = await repositories.events.addExtraStorage(eventId, packageGb);
    await repositories.audit.record({
      actorUserId: session.user.id,
      eventId,
      action: "event.storage_expanded",
      targetType: "event",
      targetId: eventId,
      metadata: { gb: packageGb, priceBrl: getExtraStoragePriceBrl(packageGb), devMode: process.env.NODE_ENV !== "production" }
    });

    return NextResponse.json({
      scope,
      addedGb: packageGb,
      extraStorageGb: updatedEvent.extraStorageGb,
      message: `+${packageGb} GB adicionados à cápsula deste evento.`
    });
  } catch (err) {
    console.error("[add-storage]", err);
    return NextResponse.json({ error: "Erro ao expandir armazenamento." }, { status: 500 });
  }
}
