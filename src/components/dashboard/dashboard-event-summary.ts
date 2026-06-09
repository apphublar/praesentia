import type { Event, EventType } from "@/types/domain";

export type DashboardEventSummary = {
  id: string;
  title: string;
  slug: string;
  eventType: EventType;
  capsuleActivatedAt?: string;
};

export function toDashboardEventSummary(event: Event): DashboardEventSummary {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    eventType: event.eventType,
    capsuleActivatedAt: event.capsuleActivatedAt
  };
}
