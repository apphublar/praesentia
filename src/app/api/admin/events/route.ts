import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { adminRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requirePlatformAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? "";
    const events = await adminRepository.listRecentEvents({ search, limit: 25 });
    return NextResponse.json(
      { events },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json({ error: "Erro ao carregar eventos." }, { status: 500 });
  }
}
