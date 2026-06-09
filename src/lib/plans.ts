import type { Event, EventPlan } from "@/types/domain";

const BYTES_PER_GB = 1024 * 1024 * 1024;

export const PLANS: Record<EventPlan["tier"], EventPlan> = {
  free: {
    tier: "free",
    label: "Gratuito",
    storageGb: 0.5,
    retentionMonths: 36,
    customSubdomain: false
  },
  capsule: {
    tier: "capsule",
    label: "Capsula",
    storageGb: 5,
    retentionMonths: 36,
    customSubdomain: true
  },
  family: {
    tier: "family",
    label: "Cápsula Plus",
    storageGb: 20,
    retentionMonths: 36,
    yearlyEventLimit: 6,
    customSubdomain: true
  }
};

export const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "app",
  "www",
  "login",
  "suporte",
  "ajuda",
  "checkout",
  "dashboard",
  "assets",
  "cdn"
]);

export function bytesFromGb(gb: number) {
  return Math.round(gb * BYTES_PER_GB);
}

export function gbFromBytes(bytes: number) {
  return bytes / BYTES_PER_GB;
}

export function getEventStorageLimitBytes(event: Event) {
  return bytesFromGb(event.plan.storageGb);
}

export function getEventStorageUsedBytes(event: Event) {
  return bytesFromGb(event.storageUsedGb);
}

export function getRemainingStorageBytes(event: Event) {
  return Math.max(0, getEventStorageLimitBytes(event) - getEventStorageUsedBytes(event));
}

export function canStoreMediaBytes(event: Event, byteSize: number) {
  return byteSize <= getRemainingStorageBytes(event);
}
