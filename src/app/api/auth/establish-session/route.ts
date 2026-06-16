import { NextResponse } from "next/server";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { createSessionToken, SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/auth/session-cookie";
import { syncPlatformAdminRole } from "@/lib/auth/sync-platform-admin-role";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { repositories } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.email) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const mfa = await loginRequiresMfaVerification(supabase);
  if (mfa.required) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("mfa", "1");
    loginUrl.searchParams.set("factorId", mfa.factorId);
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const userId = authData.user.id;
  const email = authData.user.email;

  try {
    await syncPlatformAdminRole(userId, email);
  } catch (error) {
    console.error("[auth] syncPlatformAdminRole failed", error);
  }

  const user = await repositories.users.findById(userId);
  if (!user) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "profile-pending");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  if (user.blockedAt) {
    return NextResponse.redirect(new URL("/login?error=account-blocked", requestUrl.origin));
  }

  const role = isPlatformAdminEmail(user.email) ? "platform_admin" : user.role;
  const token = createSessionToken({
    userId: user.id,
    role,
    name: user.name,
    email: user.email,
    reauth: true
  });

  const destination = await resolvePostLoginPath(userId, nextPath);
  const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
  response.cookies.set(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
  return response;
}
