import type { PhotoAlbumOrder } from "@/lib/album/order-types";
import type { PhotoAlbumDraft } from "@/lib/album/types";

export async function fetchPhotoAlbumOrder(eventId: string): Promise<PhotoAlbumOrder | null> {
  const response = await fetch(`/api/events/${eventId}/album`, { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Não foi possível carregar o álbum.");
  const data = (await response.json()) as { order: PhotoAlbumOrder | null };
  return data.order;
}

export async function savePhotoAlbumDraftRemote(eventId: string, draft: PhotoAlbumDraft): Promise<PhotoAlbumOrder> {
  const response = await fetch(`/api/events/${eventId}/album`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ draft })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar o álbum."));
  return (data as { order: PhotoAlbumOrder }).order;
}

export async function purchasePhotoAlbum(eventId: string): Promise<{
  ok: boolean;
  error?: string;
  redirected?: boolean;
  order?: PhotoAlbumOrder;
  message?: string;
}> {
  const response = await fetch("/api/billing/purchase-album", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId })
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return { ok: false, error: String(data.error ?? "Não foi possível enviar o pedido.") };
  }
  if (typeof data.whatsappUrl === "string" && data.mode === "whatsapp") {
    window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    return {
      ok: true,
      redirected: true,
      order: data.order as PhotoAlbumOrder | undefined,
      message: typeof data.message === "string" ? data.message : undefined
    };
  }
  return { ok: false, error: "Resposta inesperada ao enviar o pedido." };
}
