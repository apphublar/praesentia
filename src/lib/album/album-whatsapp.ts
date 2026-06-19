import { formatAlbumCurrency } from "@/lib/album/pricing";
import type { PhotoAlbumOrder } from "@/lib/album/order-types";

function normalizeWhatsAppPhone(raw: string | undefined) {
  return (raw ?? "").replace(/\D/g, "");
}

export function getPraesentiaWhatsAppPhone() {
  return normalizeWhatsAppPhone(
    process.env.NEXT_PUBLIC_PRAESENTIA_WHATSAPP_PHONE ?? process.env.PRAESENTIA_WHATSAPP_PHONE
  );
}

export function buildAlbumOrderWhatsAppMessage(input: {
  eventTitle: string;
  userName?: string;
  order: PhotoAlbumOrder;
}) {
  const { eventTitle, userName, order } = input;
  const total = formatAlbumCurrency(order.totalCents);
  const orderRef = order.id.slice(0, 8).toUpperCase();
  const greeting = userName?.trim() ? `Olá, sou ${userName.trim()}.` : "Olá!";

  return `${greeting} Gostaria de finalizar meu pedido de Álbum de Fotos Praesentia.

Evento: ${eventTitle}
Pedido: ${orderRef}
Páginas: ${order.pageCount}
Total estimado: ${total}

Já montei o álbum no painel. Podem revisar, enviar a cobrança e seguir com a produção?`;
}

export function buildAlbumOrderWhatsAppUrl(message: string, phone?: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone ?? getPraesentiaWhatsAppPhone());
  const encoded = encodeURIComponent(message);
  if (normalizedPhone) return `https://wa.me/${normalizedPhone}?text=${encoded}`;
  return `https://wa.me/?text=${encoded}`;
}
