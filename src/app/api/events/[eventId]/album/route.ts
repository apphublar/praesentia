import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { albumTotalCents } from "@/lib/album/pricing";
import type { PhotoAlbumDraft } from "@/lib/album/types";
import { repositories } from "@/lib/db";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";

function isPhotoAlbumDraft(value: unknown): value is PhotoAlbumDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as PhotoAlbumDraft;
  return draft.version === 1 && Array.isArray(draft.pages) && Array.isArray(draft.selectedPhotoIds);
}

async function loadAlbumContext(eventId: string) {
  const session = await requireSession();
  const event = await repositories.events.findById(eventId);
  if (!event) return { error: NextResponse.json({ error: "Evento não encontrado." }, { status: 404 }) };
  if (!hasCapsuleAccess(event)) {
    return { error: NextResponse.json({ error: "Ative a Cápsula do Tempo para montar o álbum." }, { status: 403 }) };
  }
  if (!(await canManageEventById(session.user, eventId))) {
    return { error: NextResponse.json({ error: "Sem permissão." }, { status: 403 }) };
  }
  return { session, event };
}

export async function GET(_request: Request, context: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await context.params;
    const ctx = await loadAlbumContext(eventId);
    if ("error" in ctx && ctx.error) return ctx.error;

    const order = await repositories.photoAlbumOrders.findByEventId(eventId);
    return NextResponse.json({ order });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[album GET]", err);
    return NextResponse.json({ error: "Erro ao carregar álbum." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const { eventId } = await context.params;
    const ctx = await loadAlbumContext(eventId);
    if ("error" in ctx && ctx.error) return ctx.error;
    const { session } = ctx;

    const body = await request.json().catch(() => ({}));
    if (!isPhotoAlbumDraft(body.draft)) {
      return NextResponse.json({ error: "Rascunho inválido." }, { status: 400 });
    }

    const existing = await repositories.photoAlbumOrders.findByEventId(eventId);
    if (
      existing &&
      (existing.status === "submitted" ||
        existing.status === "paid" ||
        existing.status === "in_production" ||
        existing.status === "shipped")
    ) {
      return NextResponse.json(
        {
          error:
            existing.status === "submitted"
              ? "Este pedido já foi enviado e não pode ser alterado."
              : "Este álbum já foi pago e não pode ser alterado.",
          order: existing
        },
        { status: 409 }
      );
    }

    const draft = body.draft as PhotoAlbumDraft;
    const pageCount = draft.pages.length;
    const totalCents = albumTotalCents(pageCount);

    const order = await repositories.photoAlbumOrders.upsertDraft({
      eventId,
      userId: session!.user.id,
      draft,
      pageCount,
      totalCents
    });

    return NextResponse.json({ order });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    const message = err instanceof Error ? err.message : "Erro ao salvar álbum.";
    console.error("[album PUT]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
