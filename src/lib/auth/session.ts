import { cookies } from "next/headers";
import { connection } from "next/server";
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
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifySessionToken(token) : null;

  if (payload) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const user = await repositories.users.findById(payload.sub);
        if (user) return { user, payload };
        return null;
      } catch (error) {
        console.error("[auth] user lookup failed", error);
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 120));
          continue;
        }
        return null;
      }
    }
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

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "REAUTH_REQUIRED";

  constructor(code: AuthError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    throw new AuthError("UNAUTHENTICATED");
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
    throw new AuthError("FORBIDDEN");
  }
  return session;
}

export function requireRecentAuthentication(session: Session) {
  if (!isRecentlyReauthenticated(session.payload)) {
    throw new AuthError("REAUTH_REQUIRED");
  }
}
