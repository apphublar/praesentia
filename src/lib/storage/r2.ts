import { createHash, createHmac } from "node:crypto";

export function buildMediaKey(eventId: string, mediaId: string, filename: string) {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return `events/${eventId}/media/${mediaId}/${safeFilename}`;
}

export function isEventMediaKey(eventId: string, key: string) {
  return key.startsWith(`events/${eventId}/media/`) && !key.includes("..");
}

export async function createUploadUrl(input: {
  key: string;
  contentType: string;
  contentLength: number;
}) {
  void input.contentType;
  void input.contentLength;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing.");
  }
  if (!bucket) throw new Error("CLOUDFLARE_R2_BUCKET is missing.");

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";
  const expires = "60";
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const credential = `${accessKeyId}/${credentialScope}`;
  const canonicalUri = `/${bucket}/${input.key.split("/").map(encodeURIComponent).join("/")}`;

  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": credential,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": expires,
    "X-Amz-SignedHeaders": "host"
  });

  const canonicalQueryString = [...query.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = "host";
  const payloadHash = "UNSIGNED-PAYLOAD";
  const canonicalRequest = ["PUT", canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
  query.set("X-Amz-Signature", signature);

  return `https://${host}${canonicalUri}?${query.toString()}`;
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function getSignatureKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const dateRegionKey = hmac(dateKey, region);
  const dateRegionServiceKey = hmac(dateRegionKey, service);
  return hmac(dateRegionServiceKey, "aws4_request");
}

export function getPublicMediaUrl(key: string) {
  const baseUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}
