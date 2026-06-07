import { NextResponse } from "next/server";
import { isProductionEnvironment } from "@/lib/env";

export function assertTrustedOrigin(request: Request) {
  if (!isProductionEnvironment()) return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowedOrigins = new Set<string>();

  if (configuredAppUrl) allowedOrigins.add(new URL(configuredAppUrl).origin);
  if (host) allowedOrigins.add(`https://${host}`);

  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json({ error: "Origem da requisicao nao autorizada." }, { status: 403 });
  }

  return null;
}
