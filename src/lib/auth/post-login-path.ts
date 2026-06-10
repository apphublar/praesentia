import { repositories } from "@/lib/db";

export async function resolvePostLoginPath(userId: string, requestedNext?: string | null) {
  const next = requestedNext?.trim() ?? "";
  if (next && next.startsWith("/") && !next.startsWith("//") && next !== "/dashboard") {
    return next;
  }

  const events = await repositories.events.listByOwner(userId);
  if (events.length === 0) return "/criar";
  return "/dashboard";
}
