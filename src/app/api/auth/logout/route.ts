import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, buildSessionCookieOptions } from "@/lib/auth/session-cookie";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function clearSession() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...buildSessionCookieOptions(), maxAge: 0 });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  await clearSession();
  return NextResponse.json({ ok: true });
}
