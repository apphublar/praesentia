import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositories } from "@/lib/db";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { isPlatformAdminEmail } from "@/lib/auth/platform-admin";
import { syncPlatformAdminRole } from "@/lib/auth/sync-platform-admin-role";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=auth-callback", requestUrl.origin));
  }

  const user = await repositories.users.findById(data.user.id);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=profile-pending", requestUrl.origin));
  }

  if (user.blockedAt) {
    return NextResponse.redirect(new URL("/login?error=account-blocked", requestUrl.origin));
  }

  await syncPlatformAdminRole(user.id, user.email);

  const supabaseAfterSync = await createSupabaseServerClient();
  const mfa = await loginRequiresMfaVerification(supabaseAfterSync);
  if (mfa.required) {
    const next = requestedNext ?? "/dashboard";
    const url = new URL("/login", requestUrl.origin);
    url.searchParams.set("mfa", "1");
    url.searchParams.set("factorId", mfa.factorId);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const refreshedUser = (await repositories.users.findById(data.user.id)) ?? user;
  const role = isPlatformAdminEmail(refreshedUser.email) ? "platform_admin" : refreshedUser.role;

  const cookieStore = await cookies();
  const token = createSessionToken({
    userId: refreshedUser.id,
    role,
    name: refreshedUser.name,
    email: refreshedUser.email,
    reauth: true
  });
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  const nextPath = await resolvePostLoginPath(refreshedUser.id, requestedNext);
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
