import { formatAlbumCurrency } from "@/lib/album/pricing";
import type { PhotoAlbumOrder } from "@/lib/album/order-types";

function fromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.MURAL_EMAIL_FROM ||
    "Praesentia <noreply@praesentia.com.br>"
  );
}

async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[album-email] RESEND_API_KEY ausente — email não enviado");
    return { ok: false as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail(),
      to: [input.to],
      subject: input.subject,
      html: input.html
    })
  });

  if (!response.ok) {
    console.error("[album-email] falha ao enviar", await response.text());
    return { ok: false as const };
  }

  return { ok: true as const };
}

export async function sendAlbumOrderConfirmationEmail(input: {
  order: PhotoAlbumOrder;
  eventTitle: string;
  userEmail: string;
  userName?: string;
}) {
  const { order, eventTitle, userEmail, userName } = input;
  const total = formatAlbumCurrency(order.totalCents);
  const greeting = userName?.trim() ? `Olá, ${userName.trim()}` : "Olá";

  return sendEmail({
    to: userEmail,
    subject: `Álbum de fotos confirmado — ${eventTitle}`,
    html: `
      <div style="font-family:Georgia,serif;line-height:1.6;color:#1f1a16;max-width:560px">
        <p>${greeting},</p>
        <p>Recebemos seu pedido de <strong>Álbum de Fotos Praesentia</strong> para o evento <strong>${eventTitle}</strong>.</p>
        <ul>
          <li><strong>Pedido:</strong> ${order.id.slice(0, 8).toUpperCase()}</li>
          <li><strong>Páginas:</strong> ${order.pageCount}</li>
          <li><strong>Total:</strong> ${total}</li>
        </ul>
        <p>Nossa equipe entrará em contato para confirmar impressão e entrega.</p>
        <p style="color:#6b5f55;font-size:13px">Praesentia — memórias que permanecem.</p>
      </div>
    `
  });
}

export async function sendAlbumOrderOpsEmail(input: {
  order: PhotoAlbumOrder;
  eventTitle: string;
  userEmail: string;
  userName?: string;
}) {
  const opsEmail = process.env.PHOTO_ALBUM_OPS_EMAIL?.trim();
  if (!opsEmail) return { ok: false as const };

  const total = formatAlbumCurrency(input.order.totalCents);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const isSubmitted = input.order.status === "submitted";

  return sendEmail({
    to: opsEmail,
    subject: isSubmitted
      ? `[Álbum] Novo pedido para revisão — ${input.eventTitle}`
      : `[Álbum] Novo pedido pago — ${input.eventTitle}`,
    html: `
      <div style="font-family:system-ui,sans-serif;line-height:1.5">
        <p><strong>${isSubmitted ? "Novo pedido de álbum aguardando revisão" : "Novo álbum pago"}</strong></p>
        <ul>
          <li>Evento: ${input.eventTitle}</li>
          <li>Cliente: ${input.userName?.trim() || input.userEmail}</li>
          <li>E-mail: ${input.userEmail}</li>
          <li>Pedido: ${input.order.id}</li>
          <li>Status: ${input.order.status}</li>
          <li>Páginas: ${input.order.pageCount}</li>
          <li>Total: ${total}</li>
        </ul>
        <p><a href="${base}/dashboard/eventos/${input.order.eventId}/album">Abrir álbum no painel</a></p>
      </div>
    `
  });
}
