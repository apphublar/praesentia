import type { EventFormat, EventType } from "@/types/domain";

export type EventProfile = {
  needsFormatStep: boolean;
  needsLocation: boolean;
  needsOnlineUrl: boolean;
  needsSchedule: boolean;
  scheduleOptional: boolean;
  needsRsvp: boolean;
  needsPix: boolean;
  pixRequired: boolean;
  isFundraising: boolean;
  defaultFormat: EventFormat;
};

const PARTY_DEFAULT: EventProfile = {
  needsFormatStep: true,
  needsLocation: true,
  needsOnlineUrl: true,
  needsSchedule: true,
  scheduleOptional: false,
  needsRsvp: true,
  needsPix: false,
  pixRequired: false,
  isFundraising: false,
  defaultFormat: "in_person"
};

export function getEventProfile(eventType: EventType): EventProfile {
  if (eventType === "vaquinha") {
    return {
      needsFormatStep: false,
      needsLocation: false,
      needsOnlineUrl: false,
      needsSchedule: true,
      scheduleOptional: true,
      needsRsvp: false,
      needsPix: true,
      pixRequired: true,
      isFundraising: true,
      defaultFormat: "fundraising"
    };
  }

  return PARTY_DEFAULT;
}

export function resolveEventFormat(eventType: EventType, formatInput: string): EventFormat {
  const profile = getEventProfile(eventType);
  if (profile.isFundraising) return "fundraising";
  return formatInput === "online" ? "online" : "in_person";
}
