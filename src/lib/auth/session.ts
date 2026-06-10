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

const DB_RETRY_DELAYS_MS = [300, 700, 1500] as const;

export async function getCurrentSession(options?: { throwOnDbError?: boolean }): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? verifySessionToken(token) : null;

  if (payload) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const user = await repositories.users.findById(payload.sub);
        if (user) return { user, payload };
        return null;
      } catch (error) {
        console.error(`[auth] user lookup failed (attempt ${attempt + 1}/4)`, error);
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, DB_RETRY_DELAYS_MS[attempt]));
          continue;
        }
        if (options?.throwOnDbError) {
          throw new AuthError("SERVICE_UNAVAILABLE");
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
  code: "UNAUTHENTICATED" | "FORBIDDEN" | "REAUTH_REQUIRED" | "SERVICE_UNAVAILABLE";

  constructor(code: AuthError["code"], message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export async function requireSession() {
  const session = await getCurrentSession({ throwOnDbError: true });
  if (!session) {
    throw new AuthError("UNAUTHENTICATED");
  }
  return session;
}

export async function requirePageSession(loginNext?: string) {
  try {
    const session = await getCurrentSession({ throwOnDbError: true });
    if (!session) {
      const next = loginNext?.startsWith("/") && !loginNext.startsWith("//") ? loginNext : "/dashboard";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    return session;
  } catch (error) {
    if (error instanceof AuthError && error.code === "SERVICE_UNAVAILABLE") {
      throw new Error("Instabilidade temporária ao verificar sua sessão. Recarregue a página.");
    }
    throw error;
  }
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
