import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { repositories } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";

function sanitizeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeRedirectPath(requestUrl.searchParams.get("next"));

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

  const cookieStore = await cookies();
  const token = createSessionToken({ userId: user.id, role: user.role, reauth: true });
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
