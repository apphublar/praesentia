import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Auth guard lives in server layouts (`requirePageSession`). Middleware stays pass-through. */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/criar/:path*"]
};
