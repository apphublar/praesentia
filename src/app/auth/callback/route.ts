import { NextResponse } from "next/server";
import { createSessionForUserId, redirectWithSessionCookie } from "@/lib/auth/establish-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositories } from "@/lib/db";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing-code", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(new URL("/login?error=auth-callback", requestUrl.origin));
  }

  const user = await repositories.users.findById(data.user.id);
  if (!user) {
    return NextResponse.redirect(new URL("/login?error=profile-pending", requestUrl.origin));
  }

  if (user.blockedAt) {
    return NextResponse.redirect(new URL("/login?error=account-blocked", requestUrl.origin));
  }

  const recoveryNext =
    requestedNext === "/login/redefinir-senha" || requestedNext?.startsWith("/login/redefinir-senha?")
      ? requestedNext
      : null;

  if (recoveryNext) {
    return NextResponse.redirect(new URL(recoveryNext, requestUrl.origin));
  }

  const supabaseAfterExchange = await createSupabaseServerClient();
  const mfa = await loginRequiresMfaVerification(supabaseAfterExchange);
  if (mfa.required) {
    const next = requestedNext ?? "/dashboard";
    const url = new URL("/login", requestUrl.origin);
    url.searchParams.set("mfa", "1");
    url.searchParams.set("factorId", mfa.factorId);
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  const nextPath = await resolvePostLoginPath(data.user.id, requestedNext);
  const session = await createSessionForUserId(data.user.id, nextPath);
  if (!session.ok) {
    return NextResponse.redirect(new URL(`/login?error=profile-pending&next=${encodeURIComponent(nextPath)}`, requestUrl.origin));
  }

  return redirectWithSessionCookie(requestUrl.origin, session.nextPath, session.token);
}
