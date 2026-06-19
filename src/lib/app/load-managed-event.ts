import { notFound } from "next/navigation";
import { canManageEvent } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { getCachedEventById, getCachedEventOwnerId, getCachedMembership } from "@/lib/db/cached-queries";

export async function loadManagedEventPage(eventId: string, loginNext: string) {
  const session = await requirePageSession(loginNext);
  const event = await getCachedEventById(eventId);
  if (!event) notFound();

  const [membership, ownerId] = await Promise.all([
    getCachedMembership(event.id, session.user.id),
    getCachedEventOwnerId(event.id)
  ]);

  if (!canManageEvent(session.user, membership ?? undefined, ownerId)) {
    notFound();
  }

  return { session, event };
}
