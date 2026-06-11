import { getCurrentSession } from "@/lib/auth/session";
import { canManageEventById } from "@/lib/auth/event-access";
import { canContribute } from "@/lib/auth/permissions";
import { repositories } from "@/lib/db";
import { canGuestUploadNow, isEventInteractionLocked } from "@/lib/mural/timeline";
import { getMuralSession } from "@/lib/mural/session";
import type { Event } from "@/types/domain";

export type MuralContributor =
  | {
      kind: "manager";
      userId: string;
      authorName: string;
      canUploadVideo: true;
    }
  | {
      kind: "guest";
      userId: string;
      guestRsvpId: string;
      authorName: string;
      canUploadVideo: false;
    }
  | null;

export async function resolveMuralContributor(event: Event): Promise<MuralContributor> {
  if (isEventInteractionLocked(event)) return null;

  const session = await getCurrentSession();
  if (session) {
    const isManager = await canManageEventById(session.user, event.id);
    if (isManager) {
      return { kind: "manager", userId: session.user.id, authorName: session.user.name, canUploadVideo: true };
    }
    const member = await repositories.members.findMembership(event.id, session.user.id);
    if (canContribute(event, member ?? undefined) && canGuestUploadNow(event)) {
      return {
        kind: "guest",
        userId: (await repositories.events.findOwnerId(event.id)) ?? session.user.id,
        guestRsvpId: `member:${session.user.id}`,
        authorName: session.user.name,
        canUploadVideo: false
      };
    }
  }

  const muralSession = await getMuralSession(event.id);
  if (!muralSession || !canGuestUploadNow(event)) return null;

  const ownerId = await repositories.events.findOwnerId(event.id);
  if (!ownerId) return null;

  return {
    kind: "guest",
    userId: ownerId,
    guestRsvpId: muralSession.guestRsvpId,
    authorName: muralSession.guestName,
    canUploadVideo: false
  };
}
