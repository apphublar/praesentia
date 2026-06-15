import type { EventListItem } from "@/components/app/my-events-screen";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import type { Event, GuestRsvp } from "@/types/domain";

function groupRsvpsByEvent(rsvps: GuestRsvp[]) {
  const map = new Map<string, GuestRsvp[]>();
  for (const rsvp of rsvps) {
    const list = map.get(rsvp.eventId) ?? [];
    list.push(rsvp);
    map.set(rsvp.eventId, list);
  }
  return map;
}

export async function loadDashboardEventItems(events: Event[]): Promise<EventListItem[]> {
  if (events.length === 0) return [];

  const eventIds = events.map((event) => event.id);
  const [rsvps, mediaCounts] = await Promise.all([
    safeRepositoryCall(() => repositories.guestRsvps.listByEventIds(eventIds), [], "guestRsvps.listByEventIds"),
    safeRepositoryCall(
      () => repositories.media.countPublishedByEventIds(eventIds),
      {} as Record<string, number>,
      "media.countPublishedByEventIds"
    )
  ]);

  const rsvpsByEvent = groupRsvpsByEvent(rsvps);

  return events.map((event) => ({
    event,
    rsvps: rsvpsByEvent.get(event.id) ?? [],
    mediaCount: mediaCounts[event.id] ?? 0
  }));
}
