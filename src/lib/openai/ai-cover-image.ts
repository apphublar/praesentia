import { PublicAiCoverError, toPublicCoverImageErrorMessage } from "@/lib/openai/ai-cover-errors";
import {
  buildCoverInvitationSpec,
  buildPremiumCoverPrompt,
  mergeCoverRequestSummary,
  type CoverFieldsOverride,
  type CoverIncludeFields,
  type CoverRequestSummary
} from "@/lib/openai/cover-invitation-spec";
import { getOpenAIClient } from "@/lib/openai/client";
import { createTextCompletionWithFallback } from "@/lib/openai/text-completion";
import { optimizeCoverImageBuffer } from "@/lib/images/optimize-cover-image";
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
  /** Quando true, a foto real é composta pelo app — a IA só gera fundo + textos. */
  externalPhotoCompose?: boolean;
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
const MAX_IMAGE_PROMPT_CHARS = 4000;
const SKIP_REFINE_MIN_VISUAL_CHARS = 180;

const COVER_STORAGE_KEY = (eventId: string, extension = "jpg") =>
  `events/${eventId}/cover/${Date.now()}.${extension}`;

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function trimCoverPromptForImageApi(prompt: string) {
  if (prompt.length <= MAX_IMAGE_PROMPT_CHARS) return prompt;

  const bottomMarker = "BOTTOM TEXT LINES";
  const bottomIdx = prompt.indexOf(bottomMarker);
  if (bottomIdx > 0) {
    const tail = prompt.slice(bottomIdx);
    const headBudget = MAX_IMAGE_PROMPT_CHARS - tail.length - 24;
    if (headBudget > 320) {
      return `${prompt.slice(0, headBudget).trim()}\n\n[...]\n\n${tail}`;
    }
  }

  return prompt.slice(0, MAX_IMAGE_PROMPT_CHARS).trim();
}

function resolveImageQualities(preferred: string) {
  if (preferred === "high") return uniqueStrings([preferred, "medium", "auto"]);
  if (preferred === "medium") return uniqueStrings([preferred, "auto"]);
  return uniqueStrings([preferred, "medium"]);
}

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
    const response = await createTextCompletionWithFallback(openai, {
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content:
            "You write ONE English prompt for OpenAI gpt-image models. " +
            "Rules: fixed 9:16 format; follow organizer visualDirection EXACTLY with zero extra clipart; " +
            "event texts only in bottomTexts at the bottom of the image; " +
            "when reservePhotoZone is true, NEVER include faces or people — design themed elements that interact with the photo zone (overlap shoulders/body OK, face must stay clear); follow organizer photo notes in photoInstructions exactly; " +
            "follow photoInstructions exactly when withHostPhoto is true; " +
            "preserve Portuguese accents in bottomTexts character by character; " +
            "do not invent text. Return ONLY the final prompt."
        },
        {
          role: "user",
          content: `Turn this spec into an image generation prompt:

${JSON.stringify(spec, null, 2)}

Layout: top/middle = visual direction + photo treatment; bottom = only bottomTexts lines.`
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
  const qualities = resolveImageQualities(input.quality);
  const prompt = trimCoverPromptForImageApi(input.prompt);

  let lastErrorMessage = "";

  for (const model of models) {
    for (const quality of qualities) {
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
            prompt,
            n: 1,
            size: input.size,
            quality,
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
        const retryQuality = /quality|invalid|unsupported/i.test(lastErrorMessage);
        if (retryQuality && quality !== qualities[qualities.length - 1]) continue;
        if (shouldTryNextImageModel(payload?.error?.message, payload?.error?.code, response.status, models, model)) {
          break;
        }
        throw new PublicAiCoverError(toPublicCoverImageErrorMessage(response.status, payload?.error?.message));
      }

      const image = payloadToDataUrl(payload?.data?.[0]);
      if (!image) {
        lastErrorMessage = "Resposta sem imagem";
        continue;
      }

      return { image, model, quality };
    }
  }

  console.error("[ai-cover-image] falha em todos os modelos", lastErrorMessage);
  throw new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
}

async function requestOpenAiImageEdit(input: {
  model: string;
  fallbackModels?: string[];
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
  const models = [input.model, ...(input.fallbackModels ?? [])]
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
  const qualities = resolveImageQualities(input.quality);
  const prompt = trimCoverPromptForImageApi(input.prompt);

  let lastError: PublicAiCoverError | null = null;

  for (const model of models) {
    for (const quality of qualities) {
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
        }

        const imageBlob = new Blob([imageBytes], { type: mimeType });
        const form = new FormData();
        form.append("model", model);
        form.append("image[]", imageBlob, `host-photo.${ext}`);
        form.append("prompt", prompt);
        form.append("n", "1");
        form.append("size", input.size);
        form.append("quality", quality);
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
          error?: { message?: string; code?: string };
        } | null;

        if (!response.ok) {
          const detail = payload?.error?.message;
          lastError = new PublicAiCoverError(toPublicCoverImageErrorMessage(response.status, detail));
          const retryQuality = /quality|invalid|unsupported/i.test(detail ?? "");
          const isRetryable = response.status >= 500 || response.status === 429;
          if (retryQuality && quality !== qualities[qualities.length - 1]) break;
          if (shouldTryNextImageModel(detail, payload?.error?.code, response.status, models, model)) break;
          if (isRetryable && attempt < 1) continue;
          if (model !== models[models.length - 1]) break;
          throw lastError;
        }

        const image = payloadToDataUrl(payload?.data?.[0]);
        if (!image) {
          lastError = new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
          continue;
        }

        return { image, model, quality };
      }
    }
  }

  throw lastError ?? new PublicAiCoverError("Não foi possível criar a imagem agora. Tente novamente em instantes.");
}

function payloadToDataUrl(payload?: { b64_json?: string; url?: string }) {
  if (!payload) return null;
  if (payload.b64_json) return `data:image/png;base64,${payload.b64_json}`;
  return payload.url ?? null;
}

async function persistGeneratedCover(eventId: string, imageDataUrl: string) {
  let buffer: Buffer;
  let contentType: string;

  if (imageDataUrl.startsWith("data:")) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new PublicAiCoverError("Falha ao salvar a imagem gerada.");
    buffer = Buffer.from(match[2], "base64");
    contentType = match[1] || "image/png";
  } else {
    const response = await fetch(imageDataUrl);
    if (!response.ok) throw new PublicAiCoverError("Falha ao baixar imagem gerada.");
    buffer = Buffer.from(await response.arrayBuffer());
    contentType = response.headers.get("content-type") || "image/png";
  }

  const optimized = await optimizeCoverImageBuffer(buffer, contentType);

  try {
    return await persistImageBuffer({
      buffer: optimized.buffer,
      key: COVER_STORAGE_KEY(eventId, optimized.extension),
      contentType: optimized.contentType,
      eventId,
      maxDataUrlBytes: 2_800_000,
      preferDataUrlBelowBytes: 2_000_000
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    console.error("[ai-cover-image] falha ao persistir capa", detail);
    throw new PublicAiCoverError(
      /publicar|armazenamento|storage/i.test(detail)
        ? "A imagem foi gerada, mas não conseguimos salvá-la. Tente novamente."
        : "Não foi possível salvar a imagem gerada. Tente novamente."
    );
  }
}

function resolveHostPhotoDataUrl(input: GenerateEventCoverImageInput) {
  if (input.externalPhotoCompose) return null;
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
  const externalPhotoCompose = Boolean(input.externalPhotoCompose);
  const hostPhotoDataUrl = resolveHostPhotoDataUrl(input);
  const withHostPhoto = Boolean(hostPhotoDataUrl);
  const reservePhotoZone =
    externalPhotoCompose && Boolean(input.requestSummary.photoInstructions?.trim());

  const spec = buildCoverInvitationSpec(input.requestSummary, { withHostPhoto, reservePhotoZone, size });
  const basePrompt = buildPremiumCoverPrompt(spec);
  const visualDirection = spec.visualDirection.trim();
  const shouldRefine = visualDirection.length < SKIP_REFINE_MIN_VISUAL_CHARS;
  const refinedPrompt = shouldRefine ? await refineCoverImagePromptWithGpt(spec) : null;
  const prompt = trimCoverPromptForImageApi(refinedPrompt ?? basePrompt);

  let generated: { image: string; model: string; quality: string };

  if (hostPhotoDataUrl) {
    generated = await requestOpenAiImageEdit({
      model,
      fallbackModels: resolveFallbackModels(model),
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
    quality: generated.quality,
    provider: "openai"
  };
}

export function buildCoverRequestSummary(
  event: Event,
  input: {
    orientation?: string;
    photoInstructions?: string;
    editHint?: string;
    coverFields?: CoverFieldsOverride;
    includeFields?: CoverIncludeFields;
  }
): CoverRequestSummary {
  return mergeCoverRequestSummary(event, {
    orientation: input.orientation,
    photoInstructions: input.photoInstructions,
    editHint: input.editHint,
    coverFields: input.coverFields
  });
}
