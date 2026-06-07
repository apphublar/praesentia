import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  headers: securityHeaders,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com"
      },
      {
        protocol: "https",
        hostname: "**.praesentia.com.br"
      }
    ]
  }
};

export default nextConfig;
