import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth/session";

export function apiAuthErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    if (error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }
    if (error.code === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    if (error.code === "REAUTH_REQUIRED") {
      return NextResponse.json({ error: "Confirme sua senha novamente." }, { status: 401 });
    }
  }
  return null;
}
