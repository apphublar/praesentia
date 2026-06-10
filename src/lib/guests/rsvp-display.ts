import type { GuestRsvp } from "@/types/domain";

export function guestPartySize(rsvp: GuestRsvp) {
  return rsvp.companionName?.trim() ? 2 : 1;
}

export function sumPartySize(rsvps: GuestRsvp[]) {
  return rsvps.reduce((total, rsvp) => total + guestPartySize(rsvp), 0);
}

export function guestCheckInLabel(rsvp: GuestRsvp) {
  const companion = rsvp.companionName?.trim();
  if (!companion) return rsvp.guestName;
  return `${rsvp.guestName} + ${companion}`;
}

export function guestMatchesSearch(rsvp: GuestRsvp, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [rsvp.guestName, rsvp.companionName ?? ""].join(" ").toLowerCase();
  return haystack.includes(normalized);
}
