import { CREATE_EVENT_PATH } from "@/lib/auth/routes";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { repositories } from "@/lib/db";

export async function resolvePostLoginPath(userId: string, requestedNext?: string | null) {
  const next = requestedNext?.trim() ?? "";
  const user = await repositories.users.findById(userId);
  const isAdmin = user ? isPlatformAdminEmail(user.email) : false;

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    if (next.startsWith("/admin") && !isAdmin) {
      return "/dashboard";
    }
    return next;
  }

  if (isAdmin) return "/admin";

  const events = await repositories.events.listByOwner(userId);
  if (events.length === 0) return CREATE_EVENT_PATH;
  return "/dashboard";
}
