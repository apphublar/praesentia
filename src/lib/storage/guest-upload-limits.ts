import { canAcceptStorageUpload, buildStorageLimitMessage, type StorageSnapshot } from "@/lib/storage/quota";

type GuestPhotoUploadInput = {
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

  return { ok: true };
}
