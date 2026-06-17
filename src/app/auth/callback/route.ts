import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { attachSessionCookieToResponse, createSessionForUserId } from "@/lib/auth/establish-session";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { repositories } from "@/lib/db";
import { createSupabaseRouteHandlerClient, redirectWithPendingCookies } from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";

function isRecoveryPath(next: string | null) {
  return next === "/login/redefinir-senha" || Boolean(next?.startsWith("/login/redefinir-senha?"));
}

function loginErrorRedirect(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.nextUrl.origin));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = request.nextUrl.searchParams.get("type");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const recoveryFlow = isRecoveryPath(requestedNext) || otpType === "recovery";

  if (!code && !(tokenHash && otpType)) {
    return loginErrorRedirect(request, "missing-code");
  }

  const pendingCookies: Parameters<typeof createSupabaseRouteHandlerClient>[1] = [];
  const supabase = createSupabaseRouteHandlerClient(request, pendingCookies);

  let authUserId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      console.error("[auth/callback] exchangeCodeForSession failed", error?.message);
      return loginErrorRedirect(request, "auth-callback");
    }
    authUserId = data.user.id;
  } else if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType as EmailOtpType
    });
    if (error || !data.user?.email) {
      console.error("[auth/callback] verifyOtp failed", error?.message);
      return loginErrorRedirect(request, "auth-callback");
    }
    authUserId = data.user.id;
  }

  if (!authUserId) {
    return loginErrorRedirect(request, "auth-callback");
  }

  const user = await repositories.users.findById(authUserId);
  if (!user) {
    return loginErrorRedirect(request, "profile-pending");
  }

  if (user.blockedAt) {
    return loginErrorRedirect(request, "account-blocked");
  }

  if (recoveryFlow) {
    const recoveryPath = isRecoveryPath(requestedNext) ? requestedNext! : "/login/redefinir-senha";
    return redirectWithPendingCookies(request, recoveryPath, pendingCookies);
  }

  const mfa = await loginRequiresMfaVerification(supabase);
  if (mfa.required) {
    const next = requestedNext ?? "/dashboard";
    const mfaUrl = new URL("/login", request.nextUrl.origin);
    mfaUrl.searchParams.set("mfa", "1");
    mfaUrl.searchParams.set("factorId", mfa.factorId);
    mfaUrl.searchParams.set("next", next);
    return redirectWithPendingCookies(request, `${mfaUrl.pathname}${mfaUrl.search}`, pendingCookies);
  }

  const nextPath = await resolvePostLoginPath(authUserId, requestedNext);
  const session = await createSessionForUserId(authUserId, nextPath);
  if (!session.ok) {
    const pendingUrl = new URL("/login", request.nextUrl.origin);
    pendingUrl.searchParams.set("error", "profile-pending");
    pendingUrl.searchParams.set("next", nextPath);
    return redirectWithPendingCookies(request, `${pendingUrl.pathname}${pendingUrl.search}`, pendingCookies);
  }

  const response = redirectWithPendingCookies(request, session.nextPath, pendingCookies);
  return attachSessionCookieToResponse(response, session.token);
}
