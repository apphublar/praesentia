import { createHmac, timingSafeEqual } from "node:crypto";
import { isProductionEnvironment } from "@/lib/env";

export const MURAL_SESSION_COOKIE = "praesentia_mural_session";

export type MuralSessionPayload = {
  eventId: string;
  guestRsvpId: string;
  email: string;
  guestName: string;
  iat: number;
  exp: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && isProductionEnvironment()) {
    throw new Error("SESSION_SECRET is required in production.");
  }
  return secret || "development-session-secret-change-me";
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function unbase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createMuralSessionToken(input: Omit<MuralSessionPayload, "iat" | "exp">) {
  const now = Math.floor(Date.now() / 1000);
  const payload: MuralSessionPayload = {
    ...input,
    iat: now,
    exp: now + 60 * 60 * 24 * 3
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyMuralSessionToken(token: string): MuralSessionPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) return null;

  try {
    const payload = JSON.parse(unbase64url(encoded)) as MuralSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.eventId || !payload.guestRsvpId || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export const muralSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProductionEnvironment(),
  path: "/",
  maxAge: 60 * 60 * 24 * 3
};
