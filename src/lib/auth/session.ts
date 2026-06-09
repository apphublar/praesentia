import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { repositories } from "@/lib/db";
import { isDevelopmentBypassAllowed } from "@/lib/env";
import { users } from "@/lib/mock-data";
import {
  isRecentlyReauthenticated,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload
} from "@/lib/auth/session-cookie";
import type { User } from "@/types/domain";

export type Session = {
  user: User;
  payload: SessionPayload;
};

export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifySessionToken(token) : null;

  if (payload) {
    const user = await repositories.users.findById(payload.sub);
    if (user) return { user, payload };
  }

  if (isDevelopmentBypassAllowed()) {
    const devUserId = process.env.DEV_SESSION_USER_ID || "usr_owner";
    const user = users.find((item) => item.id === devUserId) ?? users[0];
    return {
      user,
      payload: {
        sub: user.id,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        authTime: Math.floor(Date.now() / 1000),
        reauthTime: Math.floor(Date.now() / 1000)
      }
    };
  }

  return null;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}

export async function requirePageSession(loginNext?: string) {
  const session = await getCurrentSession();
  if (!session) {
    const next = loginNext?.startsWith("/") && !loginNext.startsWith("//") ? loginNext : "/dashboard";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  return session;
}

export function isPlatformAdmin(user: User) {
  return user.role === "platform_admin";
}

export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!isPlatformAdmin(session.user)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function requireRecentAuthentication(session: Session) {
  if (!isRecentlyReauthenticated(session.payload)) {
    throw new Error("REAUTH_REQUIRED");
  }
}
