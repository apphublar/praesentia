import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

function productionRedirects(): NonNullable<NextConfig["redirects"]> {
  return async () => [
    {
      source: "/:path*",
      has: [{ type: "host", value: "praesentia.com.br" }],
      destination: "https://www.praesentia.com.br/:path*",
      permanent: true
    }
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  headers: securityHeaders,
  redirects: process.env.APP_ENV === "production" ? productionRedirects() : undefined,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com"
      },
      {
        protocol: "https",
        hostname: "**.praesentia.com.br"
      },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net"
      }
    ]
  }
};

export default nextConfig;
