import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { repositories } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME, sessionCookieOptions } from "@/lib/auth/session-cookie";
import { isDevelopmentBypassAllowed } from "@/lib/env";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  if (!isDevelopmentBypassAllowed()) {
    return NextResponse.json({ error: "Dev login desabilitado em producao." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email = sanitizeText(body.email, 160) || "camila@example.com";
  const reauth = Boolean(body.reauth);
  const user = await repositories.users.findByEmail(email);

  if (!user) return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });

  const token = createSessionToken({ userId: user.id, role: user.role, reauth });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
