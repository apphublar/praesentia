import { fillInviteLink } from "@/lib/openai/invite-text";

export function buildInviteShareText(message: string | undefined, whatsappTemplate: string | undefined, eventLink: string) {
  const body = message?.trim() || fillInviteLink(whatsappTemplate ?? `Você está convidado(a)! Confirme aqui: {{link}}`, eventLink);
  if (body.includes(eventLink)) return body;
  return `${body}\n\n${eventLink}`;
}

export async function fetchImageFile(url: string, filename = "convite.jpg") {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar a imagem do convite.");
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  return new File([blob], filename, { type });
}

export async function shareInviteWithImage(input: {
  text: string;
  coverUrl?: string;
  filename?: string;
}) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  const files: File[] = [];
  if (input.coverUrl) {
    try {
      files.push(await fetchImageFile(input.coverUrl, input.filename ?? "convite.jpg"));
    } catch {
      // segue só com texto
    }
  }
  if (files.length && typeof navigator.canShare === "function" && navigator.canShare({ files })) {
    await navigator.share({ text: input.text, files });
    return true;
  }
  await navigator.share({ text: input.text });
  return true;
}

export function buildWhatsAppUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
