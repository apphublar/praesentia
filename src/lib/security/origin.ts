import { NextResponse } from "next/server";
import { isProductionEnvironment } from "@/lib/env";

function addOriginVariant(set: Set<string>, value: string | null | undefined) {
  if (!value) return;
  try {
    const url = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
    set.add(url.origin);
    if (url.hostname.startsWith("www.")) {
      set.add(`${url.protocol}//${url.hostname.slice(4)}${url.port ? `:${url.port}` : ""}`);
    } else {
      set.add(`${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ""}`);
    }
  } catch {
    // ignore invalid URL values
  }
}

export function assertTrustedOrigin(request: Request) {
  if (!isProductionEnvironment()) return null;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  const allowedOrigins = new Set<string>();

  addOriginVariant(allowedOrigins, process.env.NEXT_PUBLIC_APP_URL);
  addOriginVariant(allowedOrigins, host ? `https://${host}` : null);

  if (!origin || !allowedOrigins.has(origin)) {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }

  return null;
}
