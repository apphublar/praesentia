import type { Event, PlanTier } from "@/types/domain";

export type PlanFeatures = {
  mural: boolean;
  capsule: boolean;
  liveScreen: boolean;
  aiCoverGenerations: number;
  aiCoverEdits: number;
  customCoverUpload: boolean;
  guestSelfDeleteHours: number;
  checkIn: boolean;
  guestListPrint: boolean;
};

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    mural: false,
    capsule: false,
    liveScreen: false,
    aiCoverGenerations: 1,
    aiCoverEdits: 0,
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
