import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { attachSessionCookieToResponse, createSessionForUserId } from "@/lib/auth/establish-session";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { repositories } from "@/lib/db";
import { createSupabaseRouteHandlerClient, redirectWithPendingCookies } from "@/lib/supabase/route-handler";

type PendingCookie = Parameters<typeof createSupabaseRouteHandlerClient>[1];
type AuthCallbackClient = ReturnType<typeof createSupabaseRouteHandlerClient>;

function isRecoveryPath(next: string | null) {
  return next === "/login/redefinir-senha" || Boolean(next?.startsWith("/login/redefinir-senha?"));
}

function loginErrorRedirect(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.nextUrl.origin));
}

function browserFragmentBridge(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "";
  const recovery = request.nextUrl.pathname.includes("/auth/recovery") ? "1" : "";
  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirmando acesso | Praesentia</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8efe2;color:#21160f;font-family:Arial,sans-serif}
      main{width:min(420px,calc(100vw - 32px));padding:28px;border:1px solid #ead8c6;border-radius:16px;background:#fffaf2;box-shadow:0 18px 50px rgba(33,22,15,.12)}
      strong{display:block;font-size:20px;margin-bottom:8px}
      p{margin:0;color:#6d5d50;line-height:1.5}
    </style>
  </head>
  <body>
    <main>
      <strong>Confirmando seu acesso</strong>
      <p>Aguarde um instante. Estamos validando o link de autenticação.</p>
    </main>
    <script>
      (async function () {
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        if (!accessToken || !refreshToken) {
          window.location.replace("/login?error=missing-code");
          return;
        }
        const response = await fetch("/auth/callback/session", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            next: ${JSON.stringify(next)},
            recovery: ${JSON.stringify(recovery)}
          })
        });
        const data = await response.json().catch(function () { return {}; });
        window.location.replace(data.redirectTo || "/login?error=auth-callback");
      })().catch(function () {
        window.location.replace("/login?error=auth-callback");
      });
    </script>
  </body>
</html>`;
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function finishAuthCallback(
  request: NextRequest,
  supabase: AuthCallbackClient,
  pendingCookies: PendingCookie,
  authUserId: string,
  options?: { forceRecovery?: boolean }
) {
  const requestedNext = request.nextUrl.searchParams.get("next");
  const otpType = request.nextUrl.searchParams.get("type");
  const recoveryFlow = options?.forceRecovery || isRecoveryPath(requestedNext) || otpType === "recovery";

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

export async function handleAuthCallback(request: NextRequest, options?: { forceRecovery?: boolean }) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const otpType = request.nextUrl.searchParams.get("type");

  if (!code && !(tokenHash && otpType)) {
    return browserFragmentBridge(request);
  }

  const pendingCookies: PendingCookie = [];
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

  return finishAuthCallback(request, supabase, pendingCookies, authUserId, options);
}
