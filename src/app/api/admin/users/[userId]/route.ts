import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { adminRepository } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    await requirePlatformAdmin();
    const { userId } = await context.params;
    const detail = await adminRepository.getUserDetail(userId);
    if (!detail) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate"
      }
    });
  } catch (error) {
    const auth = apiAuthErrorResponse(error);
    if (auth) return auth;
    return NextResponse.json({ error: "Erro ao carregar cliente." }, { status: 500 });
  }
}
