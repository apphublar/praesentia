import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEvent } from "@/lib/auth/permissions";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";
import type { InviteCopy } from "@/types/domain";

function sanitizeInviteCopy(body: Partial<InviteCopy>): InviteCopy | null {
  const headline = sanitizeText(body.headline, 120);
  const message = sanitizeText(body.message, 4000);
  const whatsapp = sanitizeText(body.whatsapp, 500);
  if (!headline && !message && !whatsapp) return null;

  const hashtags = Array.isArray(body.hashtags)
    ? body.hashtags.map((tag) => sanitizeText(String(tag), 40)).filter(Boolean).slice(0, 8)
    : [];

  return { headline, message, whatsapp, hashtags };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const { eventId } = await params;
    const body = await request.json().catch(() => ({}));

    const [event, membership, ownerId] = await Promise.all([
      repositories.events.findById(eventId),
      repositories.members.findMembership(eventId, session.user.id),
      repositories.events.findOwnerId(eventId)
    ]);

    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

    if (!canManageEvent(session.user, membership ?? undefined, ownerId)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const inviteCopy = sanitizeInviteCopy(body.inviteCopy ?? body);
    if (!inviteCopy) {
      return NextResponse.json({ error: "Informe ao menos um campo de texto." }, { status: 400 });
    }

    await repositories.events.writeInviteCopy(eventId, inviteCopy);
    return NextResponse.json({ inviteCopy });
  } catch (error) {
    const authError = apiAuthErrorResponse(error);
    if (authError) return authError;
    console.error("[invite-copy]", error);
    return NextResponse.json({ error: "Erro ao salvar texto. Tente novamente." }, { status: 500 });
  }
}
