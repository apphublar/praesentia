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
    label: "Cápsula",
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

export {
  buildStorageSnapshot,
  canAcceptStorageUpload,
  getContractedStorageGb,
  STORAGE_UPLOAD_BUFFER_GB
} from "@/lib/storage/quota";
