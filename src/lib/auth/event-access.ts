import { canManageEvent } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import type { EventMember, User } from "@/types/domain";

export async function resolveEventManagementAccess(eventId: string, user: User) {
  const membership = await safeRepositoryCall(
    () => repositories.members.findMembership(eventId, user.id),
    null,
    "members.findMembership"
  );
  const ownerId = await safeRepositoryCall(
    () => repositories.events.findOwnerId(eventId),
    null,
    "events.findOwnerId"
  );

  return {
    membership,
    ownerId,
    allowed: canManageEvent(user, membership ?? undefined, ownerId)
  };
}

export async function canManageEventById(user: User, eventId: string) {
  const access = await resolveEventManagementAccess(eventId, user);
  return access.allowed;
}

export async function getEventMembership(eventId: string, userId: string): Promise<EventMember | null> {
  return safeRepositoryCall(
    () => repositories.members.findMembership(eventId, userId),
    null,
    "members.findMembership"
  );
}
