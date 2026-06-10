import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isProtectedRoute } from "@/lib/auth/routes";
import { SESSION_COOKIE_NAME, verifySessionTokenEdge } from "@/lib/auth/session-token-edge";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.APP_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!isProtectedRoute(pathname)) return NextResponse.next();

  const isProduction = process.env.APP_ENV === "production";
  if (!isProduction) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const payload = await verifySessionTokenEdge(token);
  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/criar", "/criar/:path*"]
};
