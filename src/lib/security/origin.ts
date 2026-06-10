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

function buildAllowedOrigins(request: Request) {
  const host = request.headers.get("host");
  const allowedOrigins = new Set<string>();
  addOriginVariant(allowedOrigins, process.env.NEXT_PUBLIC_APP_URL);
  addOriginVariant(allowedOrigins, host ? `https://${host}` : null);
  if (host) {
    allowedOrigins.add(`https://${host}`);
    allowedOrigins.add(`http://${host}`);
  }
  return allowedOrigins;
}

export function assertTrustedOrigin(request: Request) {
  if (!isProductionEnvironment()) return null;

  const secFetchSite = request.headers.get("sec-fetch-site");
  if (!secFetchSite || secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return null;
  }

  const origin = request.headers.get("origin");
  const allowedOrigins = buildAllowedOrigins(request);

  if (origin && allowedOrigins.has(origin)) {
    return null;
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      if (allowedOrigins.has(new URL(referer).origin)) {
        return null;
      }
    } catch {
      // ignore invalid referer
    }
  }

  if (secFetchSite === "cross-site") {
    return NextResponse.json({ error: "Origem da requisição não autorizada." }, { status: 403 });
  }

  return null;
}
