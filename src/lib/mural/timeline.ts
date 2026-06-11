import { getEventEndDate, getEventStartDate, resolveEventPhase } from "@/lib/events/phase";
import { hasCapsuleAccess } from "@/lib/plans/features";
import type { Event } from "@/types/domain";

export type PublicEventViewMode =
  | "rsvp_open"
  | "countdown"
  | "mural_access"
  | "live_mural"
  | "memory_view";

export function getRsvpDeadlineDate(event: Event) {
  if (!event.rsvpDeadline) return null;
  return new Date(`${event.rsvpDeadline}T23:59:59`);
}

export function isRsvpOpen(event: Event, now = new Date()) {
  if (!event.rsvpEnabled) return false;
  const deadline = getRsvpDeadlineDate(event);
  if (deadline) return now <= deadline;
  return now < getEventStartDate(event);
}

export function getPublicEventViewMode(event: Event, now = new Date()): PublicEventViewMode {
  const phase = resolveEventPhase(event, now);
  const capsule = hasCapsuleAccess(event);

  if (phase === "memory" && capsule) return "memory_view";
  if (phase === "live" && capsule) return "live_mural";
  if (!isRsvpOpen(event, now) && now < getEventStartDate(event)) return "countdown";
  if (isRsvpOpen(event, now)) return "rsvp_open";
  return "countdown";
}

export function isEventInteractionLocked(event: Event, now = new Date()) {
  return resolveEventPhase(event, now) === "memory" || now > getEventEndDate(event);
}

export function canGuestUploadNow(event: Event, now = new Date()) {
  return resolveEventPhase(event, now) === "live" && now <= getEventEndDate(event);
}
