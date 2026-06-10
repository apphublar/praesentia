import { NextResponse } from "next/server";
import { canManageEventById } from "@/lib/auth/event-access";
import { getCurrentSession, requireRecentAuthentication } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { isValidPixKey, sanitizeText } from "@/lib/security/sanitize";

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await context.params;
  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const media = await repositories.media.listPublishedByEvent(eventId);
  return NextResponse.json({ event, media });
}

export async function PATCH(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  const { eventId } = await context.params;
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Conta obrigatória." }, { status: 401 });

  const event = await repositories.events.findById(eventId);
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  if (!(await canManageEventById(session.user, eventId))) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const hasSensitiveChange = body.visibility === "public" || body.subdomain;

  if (hasSensitiveChange) {
    try {
      requireRecentAuthentication(session);
    } catch {
      return NextResponse.json({ error: "Reautenticação necessária para esta ação." }, { status: 428 });
    }
  }

  if (body.pix) {
    const key = sanitizeText(body.pix.key, 120);
    if (body.pix.enabled && !isValidPixKey(key)) {
      return NextResponse.json({ error: "Chave Pix inválida." }, { status: 400 });
    }
  }

  if (body.visibility === "public" && body.acceptedPublicTerms !== true) {
    return NextResponse.json({ error: "Aceite os termos para tornar o evento público." }, { status: 400 });
  }

  if (body.visibility === "public" || body.visibility === "private") {
    await repositories.events.setVisibility(eventId, body.visibility, session.user.id);
  }

  if (body.pix) {
    await repositories.events.updatePixSettings(eventId, session.user.id, {
      enabled: Boolean(body.pix.enabled),
      receiverName: sanitizeText(body.pix.receiverName, 120),
      key: sanitizeText(body.pix.key, 120),
      suggestedAmount: Number(body.pix.suggestedAmount || 0) || undefined,
      message: sanitizeText(body.pix.message, 180)
    });
  }

  return NextResponse.json({ ok: true, message: "Evento atualizado." });
}
