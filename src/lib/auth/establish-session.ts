import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { syncPlatformAdminRole } from "@/lib/auth/sync-platform-admin-role";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { createSessionToken, SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/auth/session-cookie";

export type EstablishSessionResult =
  | { ok: true; nextPath: string; token: string }
  | { ok: false; error: string };

export async function createSessionForUserId(
  userId: string,
  requestedNextPath?: string | null
): Promise<EstablishSessionResult> {
  const user = await repositories.users.findById(userId);
  if (!user) {
    return {
      ok: false,
      error: "Perfil ainda não está pronto. Aguarde alguns segundos e tente novamente."
    };
  }

  try {
    await syncPlatformAdminRole(userId, user.email);
  } catch (error) {
    console.error("[auth] syncPlatformAdminRole failed", error);
  }

  if (user.blockedAt) {
    return { ok: false, error: "Esta conta está bloqueada. Entre em contato com o suporte." };
  }

  const role = isPlatformAdminEmail(user.email) ? "platform_admin" : user.role;
  const token = createSessionToken({
    userId: user.id,
    role,
    name: user.name,
    email: user.email,
    reauth: true
  });
  const nextPath = await resolvePostLoginPath(userId, requestedNextPath ?? undefined);

  return { ok: true, nextPath, token };
}

export function attachSessionCookieToResponse(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
  return response;
}

export function redirectWithSessionCookie(origin: string, destination: string, token: string) {
  const response = NextResponse.redirect(new URL(destination, origin));
  return attachSessionCookieToResponse(response, token);
}

export async function establishPraesentiaSessionForUser(
  userId: string,
  _email: string,
  nextPath: string
): Promise<EstablishSessionResult> {
  const result = await createSessionForUserId(userId, nextPath);
  if (!result.ok) return result;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, result.token, buildSessionCookieOptions());
  revalidatePath("/", "layout");

  return result;
}
