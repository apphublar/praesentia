import type { Event } from "@/types/domain";
import {
  AI_COVER_PACK_PRICE_LABEL,
  FREE_AI_COVER_EDITS,
  FREE_AI_COVER_GENERATIONS,
  FREE_AI_TEXT_GENERATIONS
} from "@/lib/plans/ai-cover-pack";
import {
  AI_INVITE_PER_EVENT_MAX,
  CAPSULE_AI_COVER_GENERATIONS,
  FAMILY_AI_COVER_PER_EVENT_MAX,
  FAMILY_AI_COVER_POOL_TOTAL,
  type AiInviteUpgradePlan
} from "@/lib/plans/ai-invite-plans";

export type PlanFeatures = {
  mural: boolean;
  capsule: boolean;
  liveScreen: boolean;
  aiCoverGenerations: number;
  aiCoverEdits: number;
  aiTextGenerations: number;
  aiTextEdits: number;
  customCoverUpload: boolean;
  guestSelfDeleteHours: number;
  checkIn: boolean;
  guestListPrint: boolean;
};

export type AiCoverAccountContext = {
  freeVersionUsed: boolean;
  invitePoolRemaining: number;
  invitePoolPlan?: AiInviteUpgradePlan;
  familyGenerationsUsed: number;
};

export type AiCoverQuota = {
  maxGenerations: number;
  maxEdits: number;
  remainingGenerations: number;
  remainingEdits: number;
  canGenerate: boolean;
  canEdit: boolean;
  allowsCustomUpload: boolean;
  testingMode?: true;
  freePlan?: true;
  freeIncludedGenerations?: number;
  packBonusGenerations?: number;
  packBonusEdits?: number;
  canPurchasePack?: boolean;
  canPurchaseUpgrade?: boolean;
  packPriceLabel?: string;
  perEventMax?: number;
  accountPoolRemaining?: number;
  familyPoolTotal?: number;
  familyPoolUsed?: number;
  familyPerEventMax?: number;
  showVersionCarousel?: boolean;
  invitePoolPlan?: AiInviteUpgradePlan;
};

const TESTING_UNLIMITED_COVER = process.env.AI_COVER_TESTING_UNLIMITED === "true";
const TESTING_COVER_GENERATIONS = Number(process.env.AI_COVER_TESTING_GENERATIONS ?? "10");
const TESTING_COVER_EDITS = Number(process.env.AI_COVER_TESTING_EDITS ?? "5");

export function isAiCoverTestingUnlimited() {
  return TESTING_UNLIMITED_COVER;
}

export const PLAN_FEATURES: Record<import("@/types/domain").PlanTier, PlanFeatures> = {
  free: {
    mural: false,
    capsule: false,
    liveScreen: false,
    aiCoverGenerations: TESTING_UNLIMITED_COVER ? 999 : FREE_AI_COVER_GENERATIONS,
    aiCoverEdits: TESTING_UNLIMITED_COVER ? 999 : FREE_AI_COVER_EDITS,
    aiTextGenerations: FREE_AI_TEXT_GENERATIONS,
    aiTextEdits: 0,
    customCoverUpload: true,
    guestSelfDeleteHours: 0,
    checkIn: true,
    guestListPrint: true
  },
  capsule: {
    mural: true,
    capsule: true,
    liveScreen: true,
    aiCoverGenerations: CAPSULE_AI_COVER_GENERATIONS,
    aiCoverEdits: 3,
    aiTextGenerations: 1,
    aiTextEdits: 3,
    customCoverUpload: true,
    guestSelfDeleteHours: 24,
    checkIn: true,
    guestListPrint: true
  },
  family: {
    mural: true,
    capsule: true,
    liveScreen: true,
    aiCoverGenerations: FAMILY_AI_COVER_PER_EVENT_MAX,
    aiCoverEdits: 3,
    aiTextGenerations: 1,
    aiTextEdits: 3,
    customCoverUpload: true,
    guestSelfDeleteHours: 24,
    checkIn: true,
    guestListPrint: true
  }
};

export function hasCapsuleAccess(event: Event) {
  return Boolean(event.capsuleActivatedAt);
}

export function getEffectiveFeatures(event: Event): PlanFeatures {
  if (!hasCapsuleAccess(event)) return PLAN_FEATURES.free;
  return PLAN_FEATURES[event.plan.tier] ?? PLAN_FEATURES.capsule;
}

export function canAccessMural(event: Event) {
  return hasCapsuleAccess(event) && getEffectiveFeatures(event).mural;
}

export function canAccessCapsule(event: Event) {
  return hasCapsuleAccess(event) && getEffectiveFeatures(event).capsule;
}

export function canAccessLiveScreen(event: Event) {
  return hasCapsuleAccess(event) && getEffectiveFeatures(event).liveScreen;
}

export function getAiCoverQuota(event: Event, account?: AiCoverAccountContext): AiCoverQuota {
  const features = getEffectiveFeatures(event);
  const usedGenerations = event.aiCoverGenerationsCount;
  const usedEdits = event.aiCoverEditsCount;
  const isFreeEvent = !hasCapsuleAccess(event);

  if (isAiCoverTestingUnlimited()) {
    return {
      maxGenerations: 999,
      maxEdits: 999,
      remainingGenerations: 999,
      remainingEdits: 999,
      canGenerate: true,
      canEdit: true,
      allowsCustomUpload: features.customCoverUpload,
      testingMode: true,
      showVersionCarousel: true
    };
  }

  if (isFreeEvent) {
    const poolRemaining = account?.invitePoolRemaining ?? 0;
    const freeUsed = account?.freeVersionUsed ?? usedGenerations >= 1;
    const hasPool = poolRemaining > 0;
    const packBonusGenerations = event.aiCoverPackBonusGenerations ?? 0;
    const packBonusEdits = event.aiCoverPackBonusEdits ?? 0;

    if (hasPool) {
      const perEventMax = AI_INVITE_PER_EVENT_MAX + packBonusGenerations;
      const perEventRemaining = Math.max(0, perEventMax - usedGenerations);
      const remainingGenerations = Math.min(perEventRemaining, poolRemaining);
      return {
        maxGenerations: perEventMax,
        maxEdits: packBonusEdits,
        remainingGenerations,
        remainingEdits: Math.max(0, packBonusEdits - usedEdits),
        canGenerate: remainingGenerations > 0,
        canEdit: usedEdits < packBonusEdits,
        allowsCustomUpload: features.customCoverUpload,
        freePlan: true,
        canPurchaseUpgrade: remainingGenerations <= 0 && poolRemaining <= 0,
        perEventMax,
        accountPoolRemaining: poolRemaining,
        packBonusGenerations,
        packBonusEdits,
        showVersionCarousel: usedGenerations > 0 || remainingGenerations > 0,
        invitePoolPlan: account?.invitePoolPlan
      };
    }

    const maxGenerations = 1 + packBonusGenerations;
    const maxEdits = packBonusEdits;
    const canGenerate = !freeUsed && usedGenerations < maxGenerations;
    return {
      maxGenerations,
      maxEdits,
      remainingGenerations: canGenerate ? Math.max(0, maxGenerations - usedGenerations) : 0,
      remainingEdits: Math.max(0, maxEdits - usedEdits),
      canGenerate,
      canEdit: usedEdits < maxEdits,
      allowsCustomUpload: features.customCoverUpload,
      freePlan: true,
      freeIncludedGenerations: 1,
      canPurchaseUpgrade: !canGenerate && poolRemaining <= 0,
      canPurchasePack: true,
      packPriceLabel: AI_COVER_PACK_PRICE_LABEL,
      packBonusGenerations,
      packBonusEdits,
      perEventMax: maxGenerations,
      showVersionCarousel: false
    };
  }

  if (event.plan.tier === "family") {
    const familyUsed = account?.familyGenerationsUsed ?? usedGenerations;
    const familyRemaining = Math.max(0, FAMILY_AI_COVER_POOL_TOTAL - familyUsed);
    const perEventRemaining = Math.max(0, FAMILY_AI_COVER_PER_EVENT_MAX - usedGenerations);
    const remainingGenerations = Math.min(perEventRemaining, familyRemaining);
    return {
      maxGenerations: FAMILY_AI_COVER_PER_EVENT_MAX,
      maxEdits: features.aiCoverEdits,
      remainingGenerations,
      remainingEdits: Math.max(0, features.aiCoverEdits - usedEdits),
      canGenerate: remainingGenerations > 0,
      canEdit: usedEdits < features.aiCoverEdits,
      allowsCustomUpload: features.customCoverUpload,
      perEventMax: FAMILY_AI_COVER_PER_EVENT_MAX,
      familyPoolTotal: FAMILY_AI_COVER_POOL_TOTAL,
      familyPoolUsed: familyUsed,
      familyPerEventMax: FAMILY_AI_COVER_PER_EVENT_MAX,
      showVersionCarousel: usedGenerations > 0
    };
  }

  const maxGenerations = features.aiCoverGenerations + (event.aiCoverPackBonusGenerations ?? 0);
  const maxEdits = features.aiCoverEdits + (event.aiCoverPackBonusEdits ?? 0);
  return {
    maxGenerations,
    maxEdits,
    remainingGenerations: Math.max(0, maxGenerations - usedGenerations),
    remainingEdits: Math.max(0, maxEdits - usedEdits),
    canGenerate: usedGenerations < maxGenerations,
    canEdit: usedEdits < maxEdits,
    allowsCustomUpload: features.customCoverUpload,
    packBonusGenerations: event.aiCoverPackBonusGenerations ?? 0,
    packBonusEdits: event.aiCoverPackBonusEdits ?? 0,
    perEventMax: maxGenerations,
    showVersionCarousel: usedGenerations > 0
  };
}

export function getAiTextQuota(event: Event) {
  const features = getEffectiveFeatures(event);
  const usedGenerations = event.aiTextGenerationsCount;
  const usedEdits = event.aiTextEditsCount;
  return {
    maxGenerations: features.aiTextGenerations,
    maxEdits: features.aiTextEdits,
    remainingGenerations: Math.max(0, features.aiTextGenerations - usedGenerations),
    remainingEdits: Math.max(0, features.aiTextEdits - usedEdits),
    canGenerate: usedGenerations < features.aiTextGenerations,
    canEdit: usedEdits < features.aiTextEdits
  };
}
