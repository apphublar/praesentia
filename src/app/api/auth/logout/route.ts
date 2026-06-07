import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
