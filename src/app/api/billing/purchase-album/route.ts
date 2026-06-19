import { NextResponse } from "next/server";
import { apiAuthErrorResponse } from "@/lib/auth/api";
import { canManageEventById } from "@/lib/auth/event-access";
import { requireSession } from "@/lib/auth/session";
import { buildAlbumOrderWhatsAppMessage, buildAlbumOrderWhatsAppUrl } from "@/lib/album/album-whatsapp";
import { albumTotalCents } from "@/lib/album/pricing";
import { sendAlbumOrderOpsEmail } from "@/lib/album/order-email";
import { validateAlbumDraft } from "@/lib/album/validate";
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
    const submitted =
      order.status === "submitted"
        ? { ...order, pageCount, totalCents }
        : await repositories.photoAlbumOrders.markSubmitted(order.id, { pageCount, totalCents });

    const whatsappMessage = buildAlbumOrderWhatsAppMessage({
      eventTitle: event.title,
      userName: session.user.name,
      order: submitted
    });
    const whatsappUrl = buildAlbumOrderWhatsAppUrl(whatsappMessage);

    void sendAlbumOrderOpsEmail({
      order: submitted,
      eventTitle: event.title,
      userEmail: session.user.email,
      userName: session.user.name
    }).catch((err) => console.error("[purchase-album ops email]", err));

    return NextResponse.json({
      mode: "whatsapp",
      whatsappUrl,
      order: submitted,
      message: "Pedido salvo. Continue pelo WhatsApp para nossa equipe revisar e enviar a cobrança."
    });
  } catch (err) {
    const authError = apiAuthErrorResponse(err);
    if (authError) return authError;
    console.error("[purchase-album]", err);
    return NextResponse.json({ error: "Erro ao processar pedido do álbum." }, { status: 500 });
  }
}
