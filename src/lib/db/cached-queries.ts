import { cache } from "react";
import { repositories } from "@/lib/db";
import { safeRepositoryCall } from "@/lib/db/safe";
import type { Event } from "@/types/domain";

export const getCachedEventsByOwner = cache(async (userId: string) =>
  safeRepositoryCall(() => repositories.events.listByOwner(userId), [], "events.listByOwner")
);

export const getCachedEventById = cache(async (id: string) =>
  safeRepositoryCall(() => repositories.events.findById(id), null, "events.findById")
);

export const getCachedEventsByIds = cache(async (ids: string[]) => {
  if (ids.length === 0) return [] as Event[];
  return safeRepositoryCall(() => repositories.events.findByIds(ids), [], "events.findByIds");
});
