import { canAcceptStorageUpload, buildStorageLimitMessage, type StorageSnapshot } from "@/lib/storage/quota";
import type { MediaItem } from "@/types/domain";

/** Per-guest photo cap when most confirmed guests are participating (e.g. ~100 people). */
export const GUEST_PHOTOS_CAP_FULL_PARTICIPATION = 10;

type GuestPhotoUploadInput = {
  confirmedGuestCount: number;
  eventItems: MediaItem[];
  guestPhotoCount: number;
  incomingBytes: number;
  poolUsedBytes: number;
  snapshot: StorageSnapshot;
  event: Parameters<typeof canAcceptStorageUpload>[0]["event"];
  subscription: Parameters<typeof canAcceptStorageUpload>[0]["subscription"];
};

export function countConfirmedGuests(rsvpCount: number, members: { rsvpStatus: string }[]) {
  const confirmedMembers = members.filter((member) => member.rsvpStatus === "confirmed").length;
  return Math.max(1, rsvpCount, confirmedMembers);
}

export function isFairSharePhotoMode(input: {
  confirmedGuestCount: number;
  eventItems: MediaItem[];
  snapshot: StorageSnapshot;
}) {
  const photos = input.eventItems.filter((item) => item.type === "photo");
  const uploaders = new Set(photos.map((item) => item.userId)).size;
  const participationRate = uploaders / input.confirmedGuestCount;
  const averagePhotosPerGuest = photos.length / input.confirmedGuestCount;

  return (
    participationRate >= 0.25 ||
    averagePhotosPerGuest >= 3 ||
    input.snapshot.progressPercent >= 40
  );
}

export function assessGuestPhotoUpload(input: GuestPhotoUploadInput): { ok: true } | { ok: false; error: string } {
  if (
    !canAcceptStorageUpload({
      event: input.event,
      subscription: input.subscription,
      poolUsedBytes: input.poolUsedBytes,
      incomingBytes: input.incomingBytes
    })
  ) {
    return { ok: false, error: buildStorageLimitMessage(input.snapshot, input.incomingBytes) };
  }

  const fairShare = isFairSharePhotoMode({
    confirmedGuestCount: input.confirmedGuestCount,
    eventItems: input.eventItems,
    snapshot: input.snapshot
  });

  if (fairShare && input.guestPhotoCount >= GUEST_PHOTOS_CAP_FULL_PARTICIPATION) {
    return {
      ok: false,
      error: "Não há mais espaço disponível para novas fotos neste momento. O limite da cápsula está sendo compartilhado entre os convidados."
    };
  }

  return { ok: true };
}
