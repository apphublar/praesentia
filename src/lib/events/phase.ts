import type { Event, EventPhase } from "@/types/domain";
import { hasCapsuleAccess } from "@/lib/plans/features";

export function getEventStartDate(event: Event) {
  return new Date(`${event.date}T${event.startsAt}:00`);
}

export function getEventEndDate(event: Event) {
  return new Date(`${event.date}T${event.endsAt}:00`);
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
