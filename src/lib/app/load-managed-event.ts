import { notFound } from "next/navigation";
import { canManageEvent } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { getCachedEventById } from "@/lib/db/cached-queries";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";

export async function loadManagedEventPage(eventId: string, loginNext: string) {
  const session = await requirePageSession(loginNext);
  const event = await getCachedEventById(eventId);
  if (!event) notFound();

  const [membership, ownerId] = await Promise.all([
    safeRepositoryCall(() => repositories.members.findMembership(event.id, session.user.id), null, "members.findMembership"),
    safeRepositoryCall(() => repositories.events.findOwnerId(event.id), null, "events.findOwnerId")
  ]);

  if (!canManageEvent(session.user, membership ?? undefined, ownerId)) {
    notFound();
  }

  return { session, event };
}
