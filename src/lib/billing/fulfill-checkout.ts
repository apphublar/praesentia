import { canBypassBilling } from "@/lib/billing/stripe-config";
import { repositories } from "@/lib/db";
import { getEventEndDate } from "@/lib/events/phase";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { AI_INVITE_UPGRADE_PLANS, type AiInviteUpgradePlan } from "@/lib/plans/ai-invite-plans";
import { getAiCoverQuota } from "@/lib/plans/features";
import { PLANS } from "@/lib/plans";
import {
  EXTRA_STORAGE_PACKAGES_GB,
  getExtraStoragePriceBrl,
  getStorageScope,
  type ExtraStoragePackageGb
} from "@/lib/storage/quota";
import type { CheckoutKind, CheckoutMetadata } from "@/lib/billing/stripe-config";

export class BillingFulfillmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingFulfillmentError";
  }
}

export async function fulfillCapsulePurchase(eventId: string, userId: string, plan: "capsule" | "family" = "capsule") {
  const event = await repositories.events.findById(eventId);
  if (!event) throw new BillingFulfillmentError("Evento não encontrado.");
  if (event.capsuleActivatedAt) throw new BillingFulfillmentError("Este evento já possui cápsula ativa.");
  if (new Date() > getEventEndDate(event)) {
    throw new BillingFulfillmentError("Evento encerrado — cápsula indisponível.");
  }

  if (plan === "family") {
    const subscription = await repositories.subscriptions.findActiveByUser(userId);
    if (!subscription) throw new BillingFulfillmentError("Assinatura Cápsula Plus não encontrada.");
    const limit = PLANS.family.yearlyEventLimit ?? 6;
    if (subscription.eventsUsedThisPeriod >= limit) {
      throw new BillingFulfillmentError(`Limite de ${limit} eventos no período anual atingido.`);
    }
    await repositories.subscriptions.consumeEventSlot(userId);
    await repositories.events.activateCapsule(eventId, userId, "family");
  } else {
    await repositories.events.activateCapsule(eventId, userId, "capsule");
  }

  await repositories.audit.record({
    actorUserId: userId,
    eventId,
    action: "event.capsule_activated",
    targetType: "event",
    targetId: eventId,
    metadata: {
      plan,
      priceBrl: plan === "capsule" ? 59 : 0,
      priceLabel: plan === "capsule" ? "R$ 59" : "Incluído no Plus",
      devMode: canBypassBilling()
    }
  });

  return repositories.events.findById(eventId);
}

export async function fulfillPlusSubscription(userId: string) {
  const existing = await repositories.subscriptions.findActiveByUser(userId);
  if (existing) return existing;

  const subscription = await repositories.subscriptions.activateFamilyPlan(userId);
  await repositories.audit.record({
    actorUserId: userId,
    eventId: null,
    action: "subscription.activated",
    targetType: "subscription",
    targetId: subscription.id,
    metadata: { plan: "family", priceBrl: 197, priceLabel: "R$ 197/ano", devMode: canBypassBilling() }
  });
  return subscription;
}

export async function fulfillStoragePurchase(eventId: string, userId: string, gb: number) {
  if (!EXTRA_STORAGE_PACKAGES_GB.includes(gb as ExtraStoragePackageGb)) {
    throw new BillingFulfillmentError("Pacote de armazenamento inválido.");
  }
  const packageGb = gb as ExtraStoragePackageGb;
  const event = await repositories.events.findById(eventId);
  if (!event) throw new BillingFulfillmentError("Evento não encontrado.");
  if (!event.capsuleActivatedAt) throw new BillingFulfillmentError("Ative a cápsula antes de expandir o armazenamento.");

  const scope = getStorageScope(event);
  const priceBrl = getExtraStoragePriceBrl(packageGb);

  if (scope === "subscription") {
    const subscription = await repositories.subscriptions.findActiveByUser(userId);
    if (!subscription) throw new BillingFulfillmentError("Assinatura Cápsula Plus não encontrada.");
    const updatedSubscription = await repositories.subscriptions.addExtraStorage(userId, packageGb);
    await repositories.audit.record({
      actorUserId: userId,
      eventId,
      action: "subscription.storage_expanded",
      targetType: "subscription",
      targetId: updatedSubscription.id,
      metadata: { gb: packageGb, priceBrl, priceLabel: `R$ ${priceBrl}`, devMode: canBypassBilling() }
    });
    return { scope, addedGb: packageGb, extraStorageGb: updatedSubscription.extraStorageGb };
  }

  const updatedEvent = await repositories.events.addExtraStorage(eventId, packageGb);
  await repositories.audit.record({
    actorUserId: userId,
    eventId,
    action: "event.storage_expanded",
    targetType: "event",
    targetId: eventId,
    metadata: { gb: packageGb, priceBrl, priceLabel: `R$ ${priceBrl}`, devMode: canBypassBilling() }
  });
  return { scope, addedGb: packageGb, extraStorageGb: updatedEvent.extraStorageGb };
}

export async function fulfillAiInvitePlan(eventId: string, userId: string, plan: AiInviteUpgradePlan) {
  const event = await repositories.events.findById(eventId);
  if (!event) throw new BillingFulfillmentError("Evento não encontrado.");
  if (event.capsuleActivatedAt) {
    throw new BillingFulfillmentError("Pacotes de versões extras são para eventos no plano gratuito.");
  }

  const planInfo = AI_INVITE_UPGRADE_PLANS[plan];
  await repositories.users.purchaseAiInvitePlan(userId, plan);
  await repositories.audit.record({
    actorUserId: userId,
    eventId,
    action: "event.ai_invite_plan_purchased",
    targetType: "user",
    targetId: userId,
    metadata: {
      plan,
      priceLabel: planInfo.priceLabel,
      priceBrl: planInfo.priceBrl,
      versions: planInfo.versions,
      devMode: canBypassBilling()
    }
  });

  const account = await loadAiCoverAccountContext(userId);
  return {
    message: `${planInfo.versions} versões adicionadas à sua conta.`,
    quota: getAiCoverQuota(event, account)
  };
}

export async function fulfillCheckoutMetadata(metadata: CheckoutMetadata) {
  const { kind, userId, eventId, plan, gb } = metadata;

  switch (kind) {
    case "capsule":
      if (!eventId) throw new BillingFulfillmentError("Evento não informado.");
      return fulfillCapsulePurchase(eventId, userId, "capsule");
    case "plus":
      return fulfillPlusSubscription(userId);
    case "storage":
      if (!eventId) throw new BillingFulfillmentError("Evento não informado.");
      return fulfillStoragePurchase(eventId, userId, Number(gb));
    case "ai_invite_plan":
      if (!eventId || !plan) throw new BillingFulfillmentError("Dados do pacote incompletos.");
      if (plan !== "inspiracao" && plan !== "criativo") {
        throw new BillingFulfillmentError("Plano de versões inválido.");
      }
      return fulfillAiInvitePlan(eventId, userId, plan);
    default:
      throw new BillingFulfillmentError("Tipo de checkout desconhecido.");
  }
}

export function parseCheckoutMetadata(raw: Record<string, string>): CheckoutMetadata | null {
  const kind = raw.kind as CheckoutKind | undefined;
  const userId = raw.userId;
  if (!kind || !userId) return null;
  return {
    kind,
    userId,
    eventId: raw.eventId || undefined,
    plan: raw.plan || undefined,
    gb: raw.gb || undefined
  };
}
