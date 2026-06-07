import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "praesentia_session";
const protectedPrefixes = ["/dashboard", "/admin"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.APP_ENV === "production";
  const needsSession = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!needsSession) return NextResponse.next();
  if (!isProduction) return NextResponse.next();

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
