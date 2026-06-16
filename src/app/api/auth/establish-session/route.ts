import { NextResponse } from "next/server";
import { createSessionForUserId, redirectWithSessionCookie } from "@/lib/auth/establish-session";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const session = await createSessionForUserId(authData.user.id, nextPath);
  if (!session.ok) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "profile-pending");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return redirectWithSessionCookie(requestUrl.origin, session.nextPath, session.token);
}
