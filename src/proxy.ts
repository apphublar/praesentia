import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";
import { isProductionEnvironment } from "@/lib/env";

const protectedPrefixes = ["/dashboard", "/admin"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsSession = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!needsSession) return NextResponse.next();

  if (!isProductionEnvironment()) return NextResponse.next();

  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (hasCookie) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
};
