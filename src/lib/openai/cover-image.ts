import { toFile } from "openai";
import { getOpenAIClient, isGptImageModel, OPENAI_IMAGE_MODEL } from "@/lib/openai/client";
import { persistRemoteImage } from "@/lib/openai/persist-image";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event } from "@/types/domain";

export type CoverIncludeFields = {
  title?: boolean;
  date?: boolean;
  location?: boolean;
  hostName?: boolean;
  theme?: boolean;
};

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
  return `${event.venueName}, ${event.venueAddress} — ${event.city}`;
}

function buildDetailsBlock(event: Event, include: CoverIncludeFields) {
  const lines: string[] = [];
  if (include.title !== false) lines.push(`Title text: "${event.title}"`);
  if (include.hostName !== false) lines.push(`Organizer: ${event.hostName}`);
  if (include.theme !== false && event.theme) lines.push(`Theme/style: ${event.theme}`);
  if (include.date !== false) lines.push(`Date: ${formatEventDate(event.date)} at ${event.startsAt}`);
  if (include.location !== false) lines.push(`Location: ${buildLocationLine(event)}`);
  return lines.join("\n");
}

export function buildCoverImagePrompt(
  event: Event,
  editHint?: string,
  orientation?: string,
  includeFields: CoverIncludeFields = {}
) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const isFundraising = event.eventFormat === "fundraising";
  const details = buildDetailsBlock(event, includeFields);
  const orientationLine = orientation ? `\nOrganizer style direction: ${orientation}` : "";
  const editLine = editHint ? `\nAdjustment requested: ${editHint}` : "";
  const honoreeLine = event.hostPhotoUrl
    ? "\nUse the provided photo of the honoree as the central subject. Keep their likeness recognizable in a festive invitation style."
    : "";

  if (isFundraising) {
    return `Create a compelling vertical fundraising campaign card inspired by Brazilian crowdfunding platforms like Vakinha.

Campaign: "${event.title}"
Organizer: ${event.hostName}
${details}${orientationLine}${editLine}${honoreeLine}

Design requirements:
- Portrait vertical format for WhatsApp and Instagram Stories
- Trustworthy, emotional, clean Brazilian design
- Visual cues for solidarity and community support
- NO payment UI — decorative background only
- Include elegant space where text could be overlaid later, but do NOT render readable typography in the image`;
  }

  return `Create a beautiful, elegant vertical digital invitation card for a ${typeLabel}.

${details}${orientationLine}${editLine}${honoreeLine}

Design requirements:
- Portrait orientation (vertical format, ideal for WhatsApp and Instagram Stories)
- Style matches the theme: ${event.theme}
- Elegant, modern, festive design appropriate for a ${typeLabel}
- Brazilian Portuguese aesthetic
- High quality invitation background design
- NO text or typography in the image — only decorative visual elements and background design`;
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

async function generateFromHostPhoto(openai: NonNullable<ReturnType<typeof getOpenAIClient>>, event: Event, prompt: string) {
  if (!event.hostPhotoUrl) return null;

  try {
    const { buffer, mime } = await loadImageBuffer(event.hostPhotoUrl);
    const imageFile = await toFile(buffer, "host-photo.png", { type: mime });

    if (isGptImageModel(OPENAI_IMAGE_MODEL)) {
      const response = await openai.images.edit({
        model: OPENAI_IMAGE_MODEL,
        image: imageFile,
        prompt,
        n: 1,
        size: "1024x1536"
      });
      return response.data?.[0]?.url ?? null;
    }

    const response = await openai.images.edit({
      model: "dall-e-2",
      image: imageFile,
      prompt,
      n: 1,
      size: "1024x1024"
    });
    return response.data?.[0]?.url ?? null;
  } catch (error) {
    console.error("[generateCoverImage] host photo edit failed", error);
    return null;
  }
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
    let temporaryUrl = await generateFromHostPhoto(openai, event, prompt);

    if (!temporaryUrl) {
      const response = isGptImageModel(OPENAI_IMAGE_MODEL)
        ? await openai.images.generate({
            model: OPENAI_IMAGE_MODEL,
            prompt,
            n: 1,
            size: "1024x1536",
            quality: "high"
          })
        : await openai.images.generate({
            model: OPENAI_IMAGE_MODEL,
            prompt,
            n: 1,
            size: "1024x1792",
            quality: "standard",
            style: "vivid"
          });

      temporaryUrl = response.data?.[0]?.url ?? null;
    }

    if (!temporaryUrl) return null;

    return persistRemoteImage({
      sourceUrl: temporaryUrl,
      key: `events/${event.id}/cover/${Date.now()}.png`,
      contentType: "image/png"
    });
  } catch (error) {
    console.error("[generateCoverImage]", error);
    return null;
  }
}
