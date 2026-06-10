import type { GuestRsvp } from "@/types/domain";

function normalizeCompanionNames(rsvp: Pick<GuestRsvp, "companionName" | "companionNames">) {
  const fromArray = (rsvp.companionNames ?? []).map((name) => name.trim()).filter(Boolean);
  if (fromArray.length) return fromArray;
  const legacy = rsvp.companionName?.trim();
  return legacy ? [legacy] : [];
}

export function guestCompanionNames(rsvp: GuestRsvp) {
  return normalizeCompanionNames(rsvp);
}

export function guestPartySize(rsvp: GuestRsvp) {
  return 1 + guestCompanionNames(rsvp).length;
}

export function sumPartySize(rsvps: GuestRsvp[]) {
  return rsvps.reduce((total, rsvp) => total + guestPartySize(rsvp), 0);
}

export function guestCheckInLabel(rsvp: GuestRsvp) {
  const companions = guestCompanionNames(rsvp);
  if (!companions.length) return rsvp.guestName;
  if (companions.length === 1) return `${rsvp.guestName} + ${companions[0]}`;
  return `${rsvp.guestName} + ${companions.length} acompanhantes`;
}

export function guestMatchesSearch(rsvp: GuestRsvp, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  const haystack = [rsvp.guestName, ...guestCompanionNames(rsvp)].join(" ").toLowerCase();
  return haystack.includes(normalized);
}

export function guestPartySummary(rsvp: GuestRsvp) {
  const companions = guestCompanionNames(rsvp);
  const size = guestPartySize(rsvp);
  return { companions, size };
}
