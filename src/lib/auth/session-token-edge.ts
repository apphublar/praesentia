export const SESSION_COOKIE_NAME = "praesentia_session";

type EdgeSessionPayload = {
  sub: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.APP_ENV === "production") return null;
  return secret || "development-session-secret-change-me";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

async function sign(encoded: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return bytesToBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

export async function verifySessionTokenEdge(token: string): Promise<EdgeSessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = await sign(encoded, secret);
  if (!timingSafeEqual(expected, signature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as EdgeSessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}
