import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProtectedRoute } from "@/lib/auth/routes";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-token-edge";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedRoute(pathname)) return NextResponse.next();

  const isProduction = process.env.APP_ENV === "production";
  if (!isProduction) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/criar", "/criar/:path*"]
};
