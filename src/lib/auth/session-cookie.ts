import { createHmac, timingSafeEqual } from "node:crypto";
import { isProductionEnvironment } from "@/lib/env";

export const SESSION_COOKIE_NAME = "praesentia_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type SessionPayload = {
  sub: string;
  role: "platform_admin" | "user";
  name?: string;
  email?: string;
  iat: number;
  exp: number;
  authTime: number;
  reauthTime?: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && isProductionEnvironment()) {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return secret || "development-session-secret-change-me";
}

function sessionCookieDomain() {
  const explicit = process.env.SESSION_COOKIE_DOMAIN?.trim();
  if (explicit) return explicit;
  // Host-only cookie evita perda de sessão entre www / apex quando mal configurado.
  return undefined;
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function unbase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(input: {
  userId: string;
  role: SessionPayload["role"];
  name?: string;
  email?: string;
  reauth?: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: input.userId,
    role: input.role,
    name: input.name,
    email: input.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    authTime: now,
    reauthTime: input.reauth ? now : undefined
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(unbase64url(encoded)) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isRecentlyReauthenticated(payload: SessionPayload, maxAgeSeconds = 60 * 10) {
  if (!payload.reauthTime) return false;
  return Math.floor(Date.now() / 1000) - payload.reauthTime <= maxAgeSeconds;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProductionEnvironment(),
  path: "/",
  domain: sessionCookieDomain(),
  maxAge: SESSION_TTL_SECONDS
};
