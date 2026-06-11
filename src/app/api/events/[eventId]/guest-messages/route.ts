import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const { eventId } = await params;
    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

    const body = await request.json();
    const authorName = sanitizeText(body.authorName, 120);
    const messageBody = sanitizeText(body.body, 500);
    const visibility = body.visibility === "private" ? "private" : "public";

    if (!authorName || !messageBody) {
      return NextResponse.json({ error: "Informe nome e mensagem." }, { status: 400 });
    }

    const message = await repositories.guestMessages.create({
      eventId,
      authorName,
      body: messageBody,
      visibility
    });

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[guest-messages]", err);
    const detail = err instanceof Error ? err.message : "";
    if (/guest_messages|relation.*does not exist/i.test(detail)) {
      return NextResponse.json(
        { error: "Banco desatualizado. Execute a migração 010 no Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Erro ao enviar recado." }, { status: 500 });
  }
}
