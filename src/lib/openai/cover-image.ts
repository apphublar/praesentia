import { getOpenAIClient, isGptImageModel, OPENAI_IMAGE_MODEL } from "@/lib/openai/client";
import { persistRemoteImage } from "@/lib/openai/persist-image";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event } from "@/types/domain";

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function buildCoverImagePrompt(event: Event, editHint?: string) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const location =
    event.eventFormat === "online"
      ? "online event"
      : `${event.venueName}, ${event.city}`;
  const editLine = editHint ? `\nAdjustment requested: ${editHint}` : "";

  return `Create a beautiful, elegant vertical digital invitation card for a ${typeLabel}.

Event: "${event.title}"
Honoree: ${event.hostName}
Theme: ${event.theme}
Date: ${formatEventDate(event.date)}
Venue: ${location}${editLine}

Design requirements:
- Portrait orientation (vertical format, ideal for WhatsApp and Instagram Stories)
- Style matches the theme: ${event.theme}
- Elegant, modern, festive design appropriate for a ${typeLabel}
- Include decorative elements that match the theme
- Color palette harmonious with the theme
- Brazilian Portuguese aesthetic
- High quality, photorealistic invitation design
- NO text or typography in the image — only decorative visual elements and background design`;
}

export async function generateCoverImage(event: Event, editHint?: string) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const prompt = buildCoverImagePrompt(event, editHint);

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

  const temporaryUrl = response.data?.[0]?.url;
  if (!temporaryUrl) return null;

  return persistRemoteImage({
    sourceUrl: temporaryUrl,
    key: `events/${event.id}/cover/${Date.now()}.png`,
    contentType: "image/png"
  });
}
