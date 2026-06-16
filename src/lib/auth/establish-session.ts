import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { repositories } from "@/lib/db";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { syncPlatformAdminRole } from "@/lib/auth/sync-platform-admin-role";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";

export type EstablishSessionResult =
  | { ok: true; nextPath: string }
  | { ok: false; error: string };

export async function establishPraesentiaSessionForUser(
  userId: string,
  email: string,
  nextPath: string
): Promise<EstablishSessionResult> {
  try {
    await syncPlatformAdminRole(userId, email);
  } catch (error) {
    console.error("[auth] syncPlatformAdminRole failed", error);
  }

  const user = await repositories.users.findById(userId);
  if (!user) {
    return {
      ok: false,
      error: "Perfil ainda não está pronto. Aguarde alguns segundos e tente novamente."
    };
  }

  if (user.blockedAt) {
    return { ok: false, error: "Esta conta está bloqueada. Entre em contato com o suporte." };
  }

  const role = isPlatformAdminEmail(user.email) ? "platform_admin" : user.role;
  const cookieStore = await cookies();
  const token = createSessionToken({
    userId: user.id,
    role,
    name: user.name,
    email: user.email,
    reauth: true
  });
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);
  revalidatePath("/", "layout");

  return { ok: true, nextPath };
}
