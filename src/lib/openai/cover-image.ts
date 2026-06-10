import { toFile } from "openai";
import { getOpenAIClient, isGptImageModel, OPENAI_IMAGE_MODEL } from "@/lib/openai/client";
import { persistImageBuffer, persistRemoteImage } from "@/lib/openai/persist-image";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event } from "@/types/domain";

export type CoverIncludeFields = {
  title?: boolean;
  date?: boolean;
  location?: boolean;
  hostName?: boolean;
  theme?: boolean;
};

const COVER_STORAGE_KEY = (eventId: string) => `events/${eventId}/cover/${Date.now()}.png`;

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function buildLocationLine(event: Event) {
  if (event.eventFormat === "fundraising") {
    return "Contribuição via Pix";
  }
  if (event.eventFormat === "online") {
    return event.onlineMeetingUrl ? `Evento online: ${event.onlineMeetingUrl}` : "Evento online";
  }
  return `${event.venueName}, ${event.city}`;
}

function buildDetailsBlock(event: Event, include: CoverIncludeFields) {
  const lines: string[] = [];
  if (include.title !== false) lines.push(`Evento: "${event.title}"`);
  if (include.hostName !== false) lines.push(`Organizador: ${event.hostName}`);
  if (include.theme !== false && event.theme) lines.push(`Tema: ${event.theme}`);
  if (include.date !== false) lines.push(`Data: ${formatEventDate(event.date)} às ${event.startsAt}`);
  if (include.location !== false) lines.push(`Local: ${buildLocationLine(event)}`);
  return lines.join("\n");
}

export function buildCoverImagePrompt(
  event: Event,
  editHint?: string,
  orientation?: string,
  includeFields: CoverIncludeFields = {}
) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const userBrief = orientation?.trim() || editHint?.trim() || `Convite vertical bonito e festivo para ${event.title}`;
  const details = buildDetailsBlock(event, includeFields);
  const honoreeLine = event.hostPhotoUrl
    ? "Inclua uma pessoa homenageada como foco visual central, com aparência festiva e reconhecível."
    : "";

  return `Crie uma imagem vertical (formato Stories/WhatsApp) para convite de ${typeLabel} no Brasil.

Pedido do organizador: ${userBrief}

${details}
${honoreeLine}

Regras:
- Retrato vertical 9:16, alta qualidade, estética brasileira contemporânea
- Visual celebrativo e elegante, pronto para compartilhar no WhatsApp
- NÃO escreva texto legível na imagem — apenas arte, decoração e composição visual
- Sem logos, sem interface de pagamento, sem marcas d'água`;
}

async function loadImageBuffer(imageUrl: string) {
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("INVALID_DATA_URL");
    return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
  }

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("HOST_PHOTO_FETCH_FAILED");
  const mime = response.headers.get("content-type") || "image/png";
  return { buffer: Buffer.from(await response.arrayBuffer()), mime };
}

type OpenAIImagePayload = { url?: string | null; b64_json?: string | null };

async function persistOpenAIImage(eventId: string, payload: OpenAIImagePayload | undefined) {
  if (!payload) return null;

  const key = COVER_STORAGE_KEY(eventId);
  const contentType = "image/png";

  if (payload.b64_json) {
    return persistImageBuffer({
      buffer: Buffer.from(payload.b64_json, "base64"),
      key,
      contentType
    });
  }

  if (payload.url) {
    return persistRemoteImage({ sourceUrl: payload.url, key, contentType });
  }

  return null;
}

async function generateFromHostPhoto(openai: NonNullable<ReturnType<typeof getOpenAIClient>>, event: Event, prompt: string) {
  if (!event.hostPhotoUrl) return null;

  try {
    const { buffer, mime } = await loadImageBuffer(event.hostPhotoUrl);
    const imageFile = await toFile(buffer, "host-photo.png", { type: mime });

    const response = isGptImageModel(OPENAI_IMAGE_MODEL)
      ? await openai.images.edit({
          model: OPENAI_IMAGE_MODEL,
          image: imageFile,
          prompt,
          n: 1,
          size: "1024x1536"
        })
      : await openai.images.edit({
          model: "dall-e-2",
          image: imageFile,
          prompt,
          n: 1,
          size: "1024x1024"
        });

    return persistOpenAIImage(event.id, response.data?.[0]);
  } catch (error) {
    console.warn("[generateCoverImage] host photo edit failed, falling back to generate", error);
    return null;
  }
}

async function generateFromPrompt(openai: NonNullable<ReturnType<typeof getOpenAIClient>>, event: Event, prompt: string) {
  if (isGptImageModel(OPENAI_IMAGE_MODEL)) {
    try {
      const response = await openai.images.generate({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        n: 1,
        size: "1024x1536",
        quality: "medium"
      });
      return persistOpenAIImage(event.id, response.data?.[0]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const isModelError = /model|not found|unsupported|invalid/i.test(message);
      if (!isModelError) throw error;
      console.warn(`[generateCoverImage] ${OPENAI_IMAGE_MODEL} unavailable, falling back to dall-e-3`);
    }
  }

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1792",
    quality: "standard",
    style: "vivid"
  });

  return persistOpenAIImage(event.id, response.data?.[0]);
}

export async function generateCoverImage(
  event: Event,
  editHint?: string,
  orientation?: string,
  includeFields?: CoverIncludeFields
) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const prompt = buildCoverImagePrompt(event, editHint, orientation, includeFields);

  try {
    if (event.hostPhotoUrl) {
      const fromHostPhoto = await generateFromHostPhoto(openai, event, prompt);
      if (fromHostPhoto) return fromHostPhoto;
    }

    return generateFromPrompt(openai, event, prompt);
  } catch (error) {
    console.error("[generateCoverImage]", error);
    return null;
  }
}
