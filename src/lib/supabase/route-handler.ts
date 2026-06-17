import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase URL and public key are required.");
  }

  return { url, key };
}

export function createSupabaseRouteHandlerClient(request: NextRequest, pendingCookies: PendingCookie[]) {
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.length = 0;
        cookiesToSet.forEach((cookie) => {
          pendingCookies.push(cookie);
        });
      }
    }
  });
}

export function redirectWithPendingCookies(request: NextRequest, path: string, pendingCookies: PendingCookie[]) {
  const response = NextResponse.redirect(new URL(path, request.nextUrl.origin));
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
