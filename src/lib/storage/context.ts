import { repositories } from "@/lib/db";
import { buildStorageSnapshot, isSharedStoragePlan, type StorageSnapshot } from "@/lib/storage/quota";
import type { Event, UserSubscription } from "@/types/domain";

export type StorageContext = {
  ownerId: string | null;
  subscription: UserSubscription | null;
  poolUsedBytes: number;
  snapshot: StorageSnapshot;
};

export async function resolveStorageContext(event: Event): Promise<StorageContext> {
  const ownerId = await repositories.events.findOwnerId(event.id);
  const subscription =
    isSharedStoragePlan(event) && ownerId
      ? await repositories.subscriptions.findActiveByUser(ownerId)
      : null;

  const poolUsedBytes =
    isSharedStoragePlan(event) && ownerId
      ? await repositories.events.sumFamilyStorageUsedBytes(ownerId)
      : event.storageUsedBytes;

  return {
    ownerId,
    subscription,
    poolUsedBytes,
    snapshot: buildStorageSnapshot({ event, subscription, poolUsedBytes })
  };
}
