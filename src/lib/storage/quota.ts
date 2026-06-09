import { bytesFromGb, gbFromBytes, PLANS } from "@/lib/plans";
import type { Event, UserSubscription } from "@/types/domain";

/** Hidden upload tolerance — not shown to customers. */
export const STORAGE_UPLOAD_BUFFER_GB = 1;

export const EXTRA_STORAGE_PACKAGES_GB = [5, 10, 25, 50] as const;
export type ExtraStoragePackageGb = (typeof EXTRA_STORAGE_PACKAGES_GB)[number];

export type StorageSnapshot = {
  contractedGb: number;
  extraGb: number;
  usedGb: number;
  eventUsedGb: number;
  isSharedPool: boolean;
  progressPercent: number;
  remainingDisplayMb: number;
};

export function isSharedStoragePlan(event: Event) {
  return event.plan.tier === "family";
}

export function getBaseStorageGb(event: Event) {
  return event.plan.storageGb;
}

export function getExtraStorageGb(event: Event, subscription?: UserSubscription | null) {
  if (isSharedStoragePlan(event)) {
    return subscription?.extraStorageGb ?? 0;
  }
  return event.extraStorageGb ?? 0;
}

export function getContractedStorageGb(event: Event, subscription?: UserSubscription | null) {
  return getBaseStorageGb(event) + getExtraStorageGb(event, subscription);
}

export function getContractedStorageBytes(event: Event, subscription?: UserSubscription | null) {
  return bytesFromGb(getContractedStorageGb(event, subscription));
}

export function getUploadLimitBytes(event: Event, subscription?: UserSubscription | null) {
  return getContractedStorageBytes(event, subscription) + bytesFromGb(STORAGE_UPLOAD_BUFFER_GB);
}

export function buildStorageSnapshot(input: {
  event: Event;
  subscription?: UserSubscription | null;
  poolUsedBytes: number;
}): StorageSnapshot {
  const { event, subscription, poolUsedBytes } = input;
  const isSharedPool = isSharedStoragePlan(event);
  const contractedGb = getContractedStorageGb(event, subscription);
  const extraGb = getExtraStorageGb(event, subscription);
  const usedGb = gbFromBytes(poolUsedBytes);
  const eventUsedGb = event.storageUsedGb;
  const contractedBytes = bytesFromGb(contractedGb);
  const progressPercent =
    contractedGb > 0 ? Math.min(100, Math.round((usedGb / contractedGb) * 1000) / 10) : 0;
  const remainingDisplayMb = Math.max(0, Math.floor((contractedBytes - poolUsedBytes) / 1024 / 1024));

  return {
    contractedGb,
    extraGb,
    usedGb,
    eventUsedGb,
    isSharedPool,
    progressPercent,
    remainingDisplayMb
  };
}

export function canAcceptStorageUpload(input: {
  event: Event;
  subscription?: UserSubscription | null;
  poolUsedBytes: number;
  incomingBytes: number;
}) {
  if (input.incomingBytes <= 0) return false;
  const limitBytes = getUploadLimitBytes(input.event, input.subscription);
  return input.poolUsedBytes + input.incomingBytes <= limitBytes;
}

export function buildStorageLimitMessage(snapshot: StorageSnapshot, requestedBytes: number) {
  const requestedMb = Math.ceil(requestedBytes / 1024 / 1024);
  if (snapshot.isSharedPool) {
    return `Limite de armazenamento do Cápsula Plus atingido (${snapshot.usedGb.toFixed(1)}/${snapshot.contractedGb} GB no total). Este arquivo tem ${requestedMb} MB.`;
  }
  return `Limite de armazenamento da cápsula atingido (${snapshot.usedGb.toFixed(1)}/${snapshot.contractedGb} GB). Este arquivo tem ${requestedMb} MB.`;
}

export function getStorageScope(event: Event): "subscription" | "event" {
  return isSharedStoragePlan(event) ? "subscription" : "event";
}

export function getExtraStoragePriceBrl(gb: ExtraStoragePackageGb) {
  const prices: Record<ExtraStoragePackageGb, number> = {
    5: 19,
    10: 29,
    25: 49,
    50: 89
  };
  return prices[gb];
}
