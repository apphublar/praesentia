import type { NextConfig } from "next";
import { isProductionEnvironment } from "../env";

function contentSecurityPolicy() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;
  const connectSources = ["'self'", "https:"];
  const mediaSources = ["'self'", "blob:", "data:", "https:"];
  const imageSources = ["'self'", "blob:", "data:", "https:"];

  for (const value of [appUrl, supabaseUrl]) {
    if (value) connectSources.push(new URL(value).origin);
  }
  if (r2PublicUrl) {
    const origin = new URL(r2PublicUrl).origin;
    imageSources.push(origin);
    mediaSources.push(origin);
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src ${imageSources.join(" ")}`,
    `media-src ${mediaSources.join(" ")}`,
    `connect-src ${connectSources.join(" ")}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    "upgrade-insecure-requests"
  ].join("; ");
}

export const securityHeaders: NonNullable<NextConfig["headers"]> = async () => [
  {
    source: "/(.*)",
    headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: contentSecurityPolicy() },
      ...(isProductionEnvironment()
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : [])
    ]
  }
];
