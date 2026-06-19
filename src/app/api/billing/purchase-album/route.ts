import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { albumTotalCents } from "@/lib/album/pricing";
import { validateAlbumDraft } from "@/lib/album/validate";
import { resolveBillingAction } from "@/lib/billing/billing-action";
import { BillingFulfillmentError, fulfillAlbumPurchase } from "@/lib/billing/fulfill-checkout";
import { repositories } from "@/lib/db";
import { hasCapsuleAccess } from "@/lib/plans/features";
import { assertTrustedOrigin } from "@/lib/security/origin";
import { sanitizeText } from "@/lib/security/sanitize";

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) return originError;

  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const eventId = sanitizeText(body.eventId, 80);

    if (!eventId) {
      return NextResponse.json({ error: "Evento não informado." }, { status: 400 });
    }

    const event = await repositories.events.findById(eventId);
    if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
    if (!hasCapsuleAccess(event)) {
      return NextResponse.json({ error: "Ative a Cápsula do Tempo para pedir o álbum." }, { status: 403 });
    }
    if (!(await canManageEventById(session.user, eventId))) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const order = await repositories.photoAlbumOrders.findByEventId(eventId);
    if (!order) {
      return NextResponse.json({ error: "Monte e salve o álbum antes de enviar para produção." }, { status: 400 });
    }
    if (order.status === "paid" || order.status === "in_production" || order.status === "shipped") {
      return NextResponse.json({ error: "Este álbum já foi pago.", order }, { status: 409 });
    }

    const media = await repositories.media.listPublishedByEvent(eventId);
    const allowedIds = new Set(media.filter((item) => item.type === "photo").map((item) => item.id));
    const validation = validateAlbumDraft(order.draft, allowedIds);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.errors[0], errors: validation.errors }, { status: 400 });
    }

    const pageCount = order.draft.pages.length;
    const totalCents = albumTotalCents(pageCount);
    const submitted = await repositories.photoAlbumOrders.markSubmitted(order.id, { pageCount, totalCents });

    const resolution = await resolveBillingAction({
      checkout: {
        kind: "album",
        userId: session.user.id,
        userEmail: session.user.email,
        eventId,
        orderId: submitted.id,
        pageCount,
        totalCents
      },
      fulfill: () => fulfillAlbumPurchase(submitted.id, eventId, session.user.id)
    });

    if (resolution.mode === "checkout") {
      return NextResponse.json({ mode: "checkout", checkoutUrl: resolution.checkoutUrl });
    }
    if (resolution.mode === "unavailable") {
      return NextResponse.json({ error: resolution.error }, { status: 503 });
    }

    return NextResponse.json({
      mode: "fulfilled",
      order: resolution.result,
      message: "Álbum enviado para produção."
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    if (err instanceof BillingFulfillmentError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[purchase-album]", err);
    return NextResponse.json({ error: "Erro ao processar pedido do álbum." }, { status: 500 });
  }
}
