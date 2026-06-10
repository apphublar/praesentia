import type { Event, PlanTier } from "@/types/domain";

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
    aiCoverGenerations: TESTING_UNLIMITED_COVER ? 999 : TESTING_COVER_GENERATIONS,
    aiCoverEdits: TESTING_UNLIMITED_COVER ? 999 : TESTING_COVER_EDITS,
    aiTextGenerations: 1,
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

export function getAiCoverQuota(event: Event) {
  const features = getEffectiveFeatures(event);
  const usedGenerations = event.aiCoverGenerationsCount;
  const usedEdits = event.aiCoverEditsCount;

  if (isAiCoverTestingUnlimited()) {
    return {
      maxGenerations: 999,
      maxEdits: 999,
      remainingGenerations: 999,
      remainingEdits: 999,
      canGenerate: true,
      canEdit: true,
      allowsCustomUpload: features.customCoverUpload,
      testingMode: true as const
    };
  }

  return {
    maxGenerations: features.aiCoverGenerations,
    maxEdits: features.aiCoverEdits,
    remainingGenerations: Math.max(0, features.aiCoverGenerations - usedGenerations),
    remainingEdits: Math.max(0, features.aiCoverEdits - usedEdits),
    canGenerate: usedGenerations < features.aiCoverGenerations,
    canEdit: usedEdits < features.aiCoverEdits,
    allowsCustomUpload: features.customCoverUpload
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
