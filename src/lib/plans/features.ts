import type { Event, PlanTier } from "@/types/domain";
import {
  AI_COVER_PACK_PRICE_LABEL,
  FREE_AI_COVER_EDITS,
  FREE_AI_COVER_GENERATIONS,
  FREE_AI_TEXT_GENERATIONS
} from "@/lib/plans/ai-cover-pack";

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
  packPriceLabel?: string;
};

const TESTING_UNLIMITED_COVER = process.env.AI_COVER_TESTING_UNLIMITED === "true";
const TESTING_COVER_GENERATIONS = Number(process.env.AI_COVER_TESTING_GENERATIONS ?? "10");
const TESTING_COVER_EDITS = Number(process.env.AI_COVER_TESTING_EDITS ?? "5");

export function isAiCoverTestingUnlimited() {
  return TESTING_UNLIMITED_COVER;
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
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
    aiCoverGenerations: 2,
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
    aiCoverGenerations: 2,
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

export function getAiCoverQuota(event: Event): AiCoverQuota {
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
      testingMode: true
    };
  }

  const packBonusGenerations = isFreeEvent ? event.aiCoverPackBonusGenerations : 0;
  const packBonusEdits = isFreeEvent ? event.aiCoverPackBonusEdits : 0;
  const maxGenerations = features.aiCoverGenerations + packBonusGenerations;
  const maxEdits = features.aiCoverEdits + packBonusEdits;

  return {
    maxGenerations,
    maxEdits,
    remainingGenerations: Math.max(0, maxGenerations - usedGenerations),
    remainingEdits: Math.max(0, maxEdits - usedEdits),
    canGenerate: usedGenerations < maxGenerations,
    canEdit: usedEdits < maxEdits,
    allowsCustomUpload: features.customCoverUpload,
    freePlan: isFreeEvent || undefined,
    freeIncludedGenerations: isFreeEvent ? features.aiCoverGenerations : undefined,
    packBonusGenerations: isFreeEvent ? packBonusGenerations : undefined,
    packBonusEdits: isFreeEvent ? packBonusEdits : undefined,
    canPurchasePack: isFreeEvent || undefined,
    packPriceLabel: isFreeEvent ? AI_COVER_PACK_PRICE_LABEL : undefined
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
