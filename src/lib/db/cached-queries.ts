import { cache } from "react";
import { unstable_cache } from "next/cache";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import type { Event } from "@/types/domain";

const getEventsByOwnerRevalidated = unstable_cache(
  async (userId: string) => safeRepositoryCall(() => repositories.events.listByOwner(userId), [], "events.listByOwner"),
  ["events-by-owner"],
  { revalidate: 20 }
);

const getEventByIdRevalidated = unstable_cache(
  async (id: string) => safeRepositoryCall(() => repositories.events.findById(id), null, "events.findById"),
  ["event-by-id"],
  { revalidate: 20 }
);

const getEventsByIdsRevalidated = unstable_cache(
  async (ids: string[]) => {
    if (ids.length === 0) return [] as Event[];
    return safeRepositoryCall(() => repositories.events.findByIds(ids), [], "events.findByIds");
  },
  ["events-by-ids"],
  { revalidate: 20 }
);

const getEventOwnerIdRevalidated = unstable_cache(
  async (eventId: string) => safeRepositoryCall(() => repositories.events.findOwnerId(eventId), null, "events.findOwnerId"),
  ["event-owner-id"],
  { revalidate: 20 }
);

const getMembershipRevalidated = unstable_cache(
  async (eventId: string, userId: string) =>
    safeRepositoryCall(() => repositories.members.findMembership(eventId, userId), null, "members.findMembership"),
  ["event-membership"],
  { revalidate: 20 }
);

export const getCachedEventsByOwner = cache(async (userId: string) =>
  getEventsByOwnerRevalidated(userId)
);

export const getCachedEventById = cache(async (id: string) =>
  getEventByIdRevalidated(id)
);

export const getCachedEventsByIds = cache(async (ids: string[]) => {
  return getEventsByIdsRevalidated(ids);
});

export const getCachedEventOwnerId = cache(async (eventId: string) =>
  getEventOwnerIdRevalidated(eventId)
);

export const getCachedMembership = cache(async (eventId: string, userId: string) =>
  getMembershipRevalidated(eventId, userId)
);
