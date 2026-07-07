import { NextRequest, NextResponse } from "next/server";
import { finishAuthCallback } from "@/lib/auth/auth-callback-handler";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export const dynamic = "force-dynamic";

function sanitizeNextPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    accessToken?: string;
    refreshToken?: string;
    next?: string;
    recovery?: string;
  } | null;

  if (!body?.accessToken || !body.refreshToken) {
    return NextResponse.json({ redirectTo: "/login?error=missing-code" }, { status: 400 });
  }

  const callbackUrl = new URL("/auth/callback", request.nextUrl.origin);
  const nextPath = sanitizeNextPath(body.next);
  if (nextPath) callbackUrl.searchParams.set("next", nextPath);
  if (body.recovery === "1") callbackUrl.searchParams.set("type", "recovery");

  const nextRequest = new NextRequest(callbackUrl, {
    headers: request.headers
  });

  const pendingCookies: Parameters<typeof createSupabaseRouteHandlerClient>[1] = [];
  const supabase = createSupabaseRouteHandlerClient(nextRequest, pendingCookies);
  const { data, error } = await supabase.auth.setSession({
    access_token: body.accessToken,
    refresh_token: body.refreshToken
  });

  if (error || !data.user?.id) {
    console.error("[auth/callback/session] setSession failed", error?.message);
    return NextResponse.json({ redirectTo: "/login?error=auth-callback" }, { status: 400 });
  }

  const response = await finishAuthCallback(nextRequest, supabase, pendingCookies, data.user.id, {
    forceRecovery: body.recovery === "1"
  });
  const location = response.headers.get("location") ?? "/dashboard";
  const json = NextResponse.json({ redirectTo: location });
  response.cookies.getAll().forEach((cookie) => {
    json.cookies.set(cookie);
  });
  return json;
}
