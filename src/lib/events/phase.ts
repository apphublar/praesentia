import type { Event, EventPhase } from "@/types/domain";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { normalizeEventDateString, parseEventDateTime } from "@/lib/events/datetime";

export function getEventStartDate(event: Event) {
  return parseEventDateTime(event.date, event.startsAt);
}

export function getEventEndDate(event: Event) {
  const start = getEventStartDate(event);
  let end = parseEventDateTime(event.date, event.endsAt);
  if (end <= start) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return end;
}

export function resolveEventPhase(event: Event, now = new Date()): EventPhase {
  if (!hasCapsuleAccess(event)) return "before";

  const start = getEventStartDate(event);
  const end = getEventEndDate(event);

  if (now < start) return "before";
  if (now >= start && now <= end) return "live";
  return "memory";
}

export function isWithinGuestDeleteWindow(event: Event, now = new Date()) {
  const start = getEventStartDate(event);
  const deadline = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return now >= start && now <= deadline;
}

export { normalizeEventDateString };
