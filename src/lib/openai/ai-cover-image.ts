import { PublicAiCoverError, toPublicCoverImageErrorMessage } from "@/lib/openai/ai-cover-errors";
import {
  buildCoverInvitationSpec,
  buildPremiumCoverPrompt,
  mergeCoverRequestSummary,
  type CoverFieldsOverride,
  type CoverIncludeFields,
  type CoverRequestSummary
} from "@/lib/openai/cover-invitation-spec";
import { getOpenAIClient, OPENAI_TEXT_MODEL } from "@/lib/openai/client";
import { persistImageBuffer } from "@/lib/openai/persist-image";
import type { Event } from "@/types/domain";

export type { CoverIncludeFields, CoverRequestSummary };

export type GenerateEventCoverImageInput = {
  event: Event;
  ownerId: string;
  artifactId: string;
  promptVersion: string;
  mode: "generate" | "edit";
  requestSummary: CoverRequestSummary;
  hostPhotoDataUrl?: string | null;
};

export type GenerateEventCoverImageResult = {
  imageDataUrl: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  provider: "openai";
};

const DEFAULT_IMAGE_MODEL = "gpt-image-2";
const DEFAULT_IMAGE_SIZE = "1024x1536";
const DEFAULT_IMAGE_QUALITY = "high";
const OPENAI_TIMEOUT_MS = 270_000;

const COVER_STORAGE_KEY = (eventId: string) => `events/${eventId}/cover/${Date.now()}.png`;

export function buildCoverGenerationPrompt(summary: CoverRequestSummary) {
  const spec = buildCoverInvitationSpec(summary, { withHostPhoto: false, size: DEFAULT_IMAGE_SIZE });
  return buildPremiumCoverPrompt(spec);
}

export function buildCoverEditWithPhotoPrompt(summary: CoverRequestSummary, size: string) {
  const spec = buildCoverInvitationSpec(summary, { withHostPhoto: true, size });
  return buildPremiumCoverPrompt(spec);
}

async function refineCoverImagePromptWithGpt(
  spec: ReturnType<typeof buildCoverInvitationSpec>
) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content:
            "You are an expert prompt engineer for OpenAI gpt-image models creating premium Brazilian party invitations. " +
            "Write ONE detailed English prompt for the image model. " +
            "The invitation must render ONLY the exact Portuguese texts provided — never placeholders, never 'Invalid Date', never English visible text. " +
            "Decorative headers must be in Brazilian Portuguese (e.g. Aniversário, Festa Infantil), never English words like celebration, birthday, or party. " +
            "When a real photo is provided, instruct the model to remove the background completely, cut out the person cleanly, and place them in a soft circular frame as the central focal point. " +
            "Return ONLY the final prompt."
        },
        {
          role: "user",
          content: `Build the best possible image generation prompt using this structured invitation spec:

${JSON.stringify(spec, null, 2)}

Requirements:
- Premium luxury invitation like high-end Instagram Story / WhatsApp invite
- Vertical 9:16 layout with clear hierarchy: title header, central photo area, date/time/location blocks, elegant footer
- Limited cohesive palette from spec
- Exact Portuguese strings must appear legibly
- ALL visible text strictly Brazilian Portuguese — zero English words in the design
- Professional typography (script + sans-serif)
- Soft lighting, watercolor/pastel polish when appropriate
- If withHostPhoto=true: background removal + circular frame + clean integration is mandatory`
        }
      ]
    });

    const refined = response.choices[0]?.message?.content?.trim();
    return refined && refined.length > 120 ? refined : null;
  } catch (error) {
    console.warn("[ai-cover-image] falha ao refinar prompt com GPT", error);
    return null;
  }
}

function resolveCoverImageSize() {
  return process.env.OPENAI_IMAGE_SIZE?.trim() || DEFAULT_IMAGE_SIZE;
}

function resolveCoverImageQuality() {
  const requested = process.env.OPENAI_IMAGE_QUALITY?.trim().toLowerCase() || DEFAULT_IMAGE_QUALITY;
  if (requested === "low" || requested === "medium" || requested === "high" || requested === "auto") {
    return requested;
  }
  return DEFAULT_IMAGE_QUALITY;
}

function resolveFallbackModels(model: string) {
  const configured = process.env.OPENAI_IMAGE_FALLBACK_MODEL?.trim();
  const defaults = ["gpt-image-1", "gpt-image-1-mini"];
  const fallbacks = configured ? [configured, ...defaults] : defaults;
  return fallbacks.filter((item) => item !== model);
}

function shouldTryNextImageModel(message?: string, code?: string, status?: number, models?: string[], model?: string) {
  if (!models || !model) return false;
  const currentIndex = models.indexOf(model);
  if (currentIndex < 0 || currentIndex >= models.length - 1) return false;
  if (status === 429) return true;
  const combined = `${message ?? ""} ${code ?? ""}`.toLowerCase();
  return /model|not found|unsupported|invalid|permission|access/i.test(combined);
}

async function requestOpenAiImage(input: {
  model: string;
  fallbackModels?: string[];
  prompt: string;
  size: string;
  quality: string;
  user: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new PublicAiCoverError("Serviço de imagem indisponível no momento. Tente novamente em instantes.");
  }

  const models = [input.model, ...(input.fallbackModels ?? [])]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);

  let lastErrorMessage = "";

  for (const model of models) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt: input.prompt,
          n: 1,
          size: input.size,
          quality: input.quality,
          background: "opaque",
          moderation: "low",
          output_format: "png",
          user: input.user
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === "AbortError") {
        throw new PublicAiCoverError("A criação da imagem demorou mais do que o esperado. Tente novamente.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string; code?: string };
    } | null;

    if (!response.ok) {
      lastErrorMessage = payload?.error?.message ?? `HTTP ${response.status}`;
      if (shouldTryNextImageModel(payload?.error?.message, payload?.error?.code, response.status, models, model)) {
        continue;
      }
      throw new PublicAiCoverError(toPublicCoverImageErrorMessage(response.status, payload?.error?.message));
    }

    const image = payloadToDataUrl(payload?.data?.[0]);
    if (!image) {
      lastErrorMessage = "Resposta sem imagem";
      continue;
    }

    return { image, model };
  }

  console.error("[ai-cover-image] falha em todos os modelos", lastErrorMessage);
  throw new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
}

async function requestOpenAiImageEdit(input: {
  model: string;
  inputImageDataUrl: string;
  prompt: string;
  size: string;
  quality: string;
  user: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new PublicAiCoverError("Serviço de imagem indisponível no momento. Tente novamente em instantes.");
  }

  const separatorIdx = input.inputImageDataUrl.indexOf(",");
  if (separatorIdx < 0) {
    throw new PublicAiCoverError("Foto inválida. Tente novamente com outra imagem.");
  }

  const header = input.inputImageDataUrl.slice(0, separatorIdx);
  const base64 = input.inputImageDataUrl.slice(separatorIdx + 1);
  const mimeType = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  const imageBytes = Buffer.from(base64, "base64");

  const MAX_ATTEMPTS = 2;
  let lastError: PublicAiCoverError | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const imageBlob = new Blob([imageBytes], { type: mimeType });
    const form = new FormData();
    form.append("model", input.model);
    form.append("image[]", imageBlob, `host-photo.${ext}`);
    form.append("prompt", input.prompt);
    form.append("n", "1");
    form.append("size", input.size);
    form.append("quality", input.quality);
    form.append("output_format", "png");
    form.append("user", input.user);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === "AbortError") {
        throw new PublicAiCoverError("A criação da imagem demorou mais do que o esperado. Tente novamente.");
      }
      lastError = new PublicAiCoverError("Erro de conexão com o serviço de imagem.");
      continue;
    } finally {
      clearTimeout(timeout);
    }

    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ b64_json?: string; url?: string }>;
      error?: { message?: string };
    } | null;

    if (!response.ok) {
      const isRetryable = response.status >= 500 || response.status === 429;
      lastError = new PublicAiCoverError(toPublicCoverImageErrorMessage(response.status, payload?.error?.message));
      if (isRetryable && attempt < MAX_ATTEMPTS - 1) continue;
      throw lastError;
    }

    const image = payloadToDataUrl(payload?.data?.[0]);
    if (!image) {
      lastError = new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
      continue;
    }

    return { image, model: input.model };
  }

  throw lastError ?? new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
}

function payloadToDataUrl(payload?: { b64_json?: string; url?: string }) {
  if (!payload) return null;
  if (payload.b64_json) return `data:image/png;base64,${payload.b64_json}`;
  return payload.url ?? null;
}

async function persistGeneratedCover(eventId: string, imageDataUrl: string) {
  if (imageDataUrl.startsWith("data:")) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new PublicAiCoverError("Falha ao salvar a imagem gerada.");
    return persistImageBuffer({
      buffer: Buffer.from(match[2], "base64"),
      key: COVER_STORAGE_KEY(eventId),
      contentType: match[1] || "image/png",
      eventId,
      maxDataUrlBytes: 4_000_000
    });
  }

  const response = await fetch(imageDataUrl);
  if (!response.ok) throw new PublicAiCoverError("Falha ao baixar imagem gerada.");
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/png";
  return persistImageBuffer({
    buffer,
    key: COVER_STORAGE_KEY(eventId),
    contentType,
    eventId,
    maxDataUrlBytes: 4_000_000
  });
}

function resolveHostPhotoDataUrl(input: GenerateEventCoverImageInput) {
  if (input.hostPhotoDataUrl?.startsWith("data:image/")) return input.hostPhotoDataUrl;
  if (input.event.hostPhotoUrl?.startsWith("data:image/")) return input.event.hostPhotoUrl;
  return null;
}

export async function generateEventCoverImage(
  input: GenerateEventCoverImageInput
): Promise<GenerateEventCoverImageResult> {
  const model = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_IMAGE_MODEL;
  const size = resolveCoverImageSize();
  const quality = resolveCoverImageQuality();
  const hostPhotoDataUrl = resolveHostPhotoDataUrl(input);
  const withHostPhoto = Boolean(hostPhotoDataUrl);

  const spec = buildCoverInvitationSpec(input.requestSummary, { withHostPhoto, size });
  const basePrompt = buildPremiumCoverPrompt(spec);
  const refinedPrompt = await refineCoverImagePromptWithGpt(spec);
  const prompt = refinedPrompt ?? basePrompt;

  let generated: { image: string; model: string };

  if (hostPhotoDataUrl) {
    generated = await requestOpenAiImageEdit({
      model,
      inputImageDataUrl: hostPhotoDataUrl,
      prompt,
      size,
      quality,
      user: input.ownerId
    });
  } else {
    generated = await requestOpenAiImage({
      model,
      fallbackModels: resolveFallbackModels(model),
      prompt,
      size,
      quality,
      user: input.ownerId
    });
  }

  const persistedUrl = await persistGeneratedCover(input.event.id, generated.image);

  return {
    imageDataUrl: persistedUrl,
    prompt,
    model: generated.model,
    size,
    quality,
    provider: "openai"
  };
}

export function buildCoverRequestSummary(
  event: Event,
  input: {
    orientation?: string;
    editHint?: string;
    coverFields?: CoverFieldsOverride;
    includeFields?: CoverIncludeFields;
  }
): CoverRequestSummary {
  return mergeCoverRequestSummary(event, {
    orientation: input.orientation,
    editHint: input.editHint,
    coverFields: input.coverFields
  });
}
