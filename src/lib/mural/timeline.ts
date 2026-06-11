import { isValidEventInstant, normalizeEventDateString, parseEventDateTime } from "@/lib/events/datetime";
import { getEventEndDate, getEventStartDate } from "@/lib/events/phase";
import { hasCapsuleAccess } from "@/lib/plans/features";
import type { Event } from "@/types/domain";

export type PublicEventViewMode =
  | "invite"
  | "countdown"
  | "live_mural"
  | "memory_view"
  | "expired";

export type PublicInvitePhase = "rsvp_open" | "countdown" | "none";

export function getRsvpDeadlineDate(event: Event) {
  if (!event.rsvpDeadline) return null;
  const date = normalizeEventDateString(event.rsvpDeadline);
  return parseEventDateTime(date, "23:59");
}

export function isRsvpOpen(event: Event, now = new Date()) {
  if (!event.rsvpEnabled) return false;
  const deadline = getRsvpDeadlineDate(event);
  if (deadline) return now <= deadline;
  return now < getEventStartDate(event);
}

export function eventRequiresRsvp(event: Event, profileNeedsRsvp: boolean) {
  return profileNeedsRsvp && event.rsvpEnabled !== false;
}

export function getSchedulePhase(event: Event, now = new Date()) {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);

  if (!isValidEventInstant(start) || !isValidEventInstant(end)) {
    return "before" as const;
  }

  if (now < start) return "before" as const;
  if (now <= end) return "live" as const;
  return "after" as const;
}

/** Fase do convite antes do evento: RSVP aberto, contagem regressiva ou nenhuma ação primária. */
export function getInvitePhase(event: Event, profileNeedsRsvp: boolean, now = new Date()): PublicInvitePhase {
  if (getSchedulePhase(event, now) !== "before") return "none";

  const rsvpRequired = eventRequiresRsvp(event, profileNeedsRsvp);
  if (rsvpRequired && isRsvpOpen(event, now)) return "rsvp_open";
  if (rsvpRequired && !isRsvpOpen(event, now)) return "countdown";
  return "none";
}

export function getPublicEventViewMode(event: Event, now = new Date()): PublicEventViewMode {
  const capsule = hasCapsuleAccess(event);
  const schedule = getSchedulePhase(event, now);

  if (!capsule && schedule === "after") return "expired";
  if (capsule && schedule === "after") return "memory_view";
  if (capsule && schedule === "live") return "live_mural";
  return "invite";
}

export function isEventInteractionLocked(event: Event, now = new Date()) {
  return getSchedulePhase(event, now) === "after";
}

export function canGuestUploadNow(event: Event, now = new Date()) {
  return getSchedulePhase(event, now) === "live";
}

export function canActivateCapsuleForEvent(event: Event, now = new Date()) {
  return getSchedulePhase(event, now) !== "after";
}
