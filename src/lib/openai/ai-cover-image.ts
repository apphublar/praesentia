import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import { PublicAiCoverError, toPublicCoverImageErrorMessage } from "@/lib/openai/ai-cover-errors";
import { getOpenAIClient, OPENAI_TEXT_MODEL } from "@/lib/openai/client";
import { persistImageBuffer } from "@/lib/openai/persist-image";
import type { Event } from "@/types/domain";

export type CoverIncludeFields = {
  title?: boolean;
  date?: boolean;
  location?: boolean;
  hostName?: boolean;
  theme?: boolean;
};

export type CoverRequestSummary = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  hostName: string;
  theme?: string;
  date: string;
  startsAt: string;
  endsAt: string;
  eventFormat: Event["eventFormat"];
  venueName: string;
  city: string;
  onlineMeetingUrl?: string;
  orientation?: string;
  editHint?: string;
  includeFields: CoverIncludeFields;
};

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

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function buildLocationLine(summary: CoverRequestSummary) {
  if (summary.eventFormat === "fundraising") return "Contribuição via Pix";
  if (summary.eventFormat === "online") {
    return summary.onlineMeetingUrl ? `Evento online: ${summary.onlineMeetingUrl}` : "Evento online";
  }
  return `${summary.venueName}, ${summary.city}`;
}

function buildCoverTextLines(summary: CoverRequestSummary) {
  const include = summary.includeFields;
  const lines: string[] = [];
  const typeLabel = EVENT_TYPE_LABELS[summary.eventType as keyof typeof EVENT_TYPE_LABELS] ?? "Evento especial";

  if (include.title !== false) lines.push(summary.eventTitle);
  if (include.hostName !== false) lines.push(`Organizado por ${summary.hostName}`);
  if (include.theme !== false && summary.theme?.trim()) lines.push(summary.theme.trim());
  if (include.date !== false) {
    lines.push(`${formatEventDate(summary.date)} · ${summary.startsAt}–${summary.endsAt}`);
  }
  if (include.location !== false) lines.push(buildLocationLine(summary));

  if (lines.length === 0) {
    lines.push(summary.eventTitle, typeLabel);
  }

  return lines;
}

function buildCoverTextBlock(summary: CoverRequestSummary) {
  return buildCoverTextLines(summary)
    .map((line) => `- "${line}"`)
    .join("\n");
}

function buildVisualBrief(summary: CoverRequestSummary) {
  return (
    summary.orientation?.trim() ||
    summary.editHint?.trim() ||
    `Convite vertical festivo e elegante para ${summary.eventTitle}`
  );
}

export function buildCoverGenerationPrompt(summary: CoverRequestSummary) {
  const typeLabel = EVENT_TYPE_LABELS[summary.eventType as keyof typeof EVENT_TYPE_LABELS] ?? "evento especial";
  const userBrief = buildVisualBrief(summary);
  const textBlock = buildCoverTextBlock(summary);

  return `Crie um convite vertical completo (formato Stories/WhatsApp, proporção 9:16) para ${typeLabel} no Brasil.

ESTILO VISUAL PEDIDO PELO ORGANIZADOR:
${userBrief}

TEXTOS OBRIGATÓRIOS NA IMAGEM (escreva EXATAMENTE estas frases, em português brasileiro, grandes e legíveis):
${textBlock}

Regras:
- Layout de convite profissional pronto para WhatsApp — não uma ilustração genérica sem texto
- Tipografia bonita e legível; hierarquia clara (título em destaque)
- Estética brasileira contemporânea, celebrativa e acolhedora
- Use apenas os textos listados acima — não invente nomes, datas ou locais diferentes
- Sem marcas d'água, sem logos de apps, sem interface de pagamento`;
}

export function buildCoverEditWithPhotoPrompt(summary: CoverRequestSummary, size: string) {
  const typeLabel = EVENT_TYPE_LABELS[summary.eventType as keyof typeof EVENT_TYPE_LABELS] ?? "evento especial";
  const userBrief = buildVisualBrief(summary);
  const textBlock = buildCoverTextBlock(summary);

  return `Crie um convite vertical completo (${size}, Stories/WhatsApp) para ${typeLabel} no Brasil usando a foto REAL do homenageado fornecida.

ESTILO VISUAL PEDIDO PELO ORGANIZADOR:
${userBrief}

TEXTOS OBRIGATÓRIOS NA IMAGEM (escreva EXATAMENTE estas frases, em português brasileiro, grandes e legíveis):
${textBlock}

REGRAS ABSOLUTAS:
- A foto do homenageado é REAL — preserve o rosto; não substitua por ilustração ou outra pessoa
- Integre a foto ao layout do convite (moldura, composição festiva)
- Layout de convite profissional com textos legíveis — não arte genérica sem informações
- Use apenas os textos listados — não invente dados do evento
- Sem marcas d'água ou logos de apps`;
}

async function refineCoverImagePromptWithGpt(
  summary: CoverRequestSummary,
  options: { withHostPhoto: boolean; size: string }
) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const typeLabel = EVENT_TYPE_LABELS[summary.eventType as keyof typeof EVENT_TYPE_LABELS] ?? "evento especial";
  const textLines = buildCoverTextLines(summary);
  const userBrief = buildVisualBrief(summary);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "Você escreve prompts detalhados em português do Brasil para o modelo gpt-image-2 gerar convites visuais de eventos. " +
            "O convite DEVE incluir os textos exatos fornecidos, legíveis na imagem. " +
            "Responda APENAS com o prompt final para geração de imagem, sem explicações."
        },
        {
          role: "user",
          content: `Tipo de evento: ${typeLabel}
Tamanho: ${options.size}
${options.withHostPhoto ? "Há foto real do homenageado — preservar rosto e integrar ao layout." : "Sem foto de referência."}

Textos OBRIGATÓRIOS na imagem (copiar exatamente):
${textLines.map((line) => `- ${line}`).join("\n")}

Pedido visual do organizador:
${userBrief}

Monte um prompt completo para gpt-image-2 criar um convite vertical bonito com esses textos legíveis na arte.`
        }
      ]
    });

    const refined = response.choices[0]?.message?.content?.trim();
    return refined && refined.length > 80 ? refined : null;
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
  const defaults = ["gpt-image-1-mini", "gpt-image-1", "dall-e-3"];
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
      const isLegacyDalle = model.startsWith("dall-e");
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(
          isLegacyDalle
            ? {
                model,
                prompt: input.prompt,
                n: 1,
                size: model === "dall-e-3" ? "1024x1792" : "1024x1024",
                quality: model === "dall-e-3" ? "standard" : undefined,
                style: model === "dall-e-3" ? "vivid" : undefined,
                user: input.user
              }
            : {
                model,
                prompt: input.prompt,
                n: 1,
                size: input.size,
                quality: input.quality,
                background: "opaque",
                moderation: "low",
                output_format: "png",
                user: input.user
              }
        ),
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

  const basePrompt = hostPhotoDataUrl
    ? buildCoverEditWithPhotoPrompt(input.requestSummary, size)
    : buildCoverGenerationPrompt(input.requestSummary);

  const refinedPrompt = await refineCoverImagePromptWithGpt(input.requestSummary, {
    withHostPhoto: Boolean(hostPhotoDataUrl),
    size
  });
  const prompt = refinedPrompt ?? basePrompt;

  let generated: { image: string; model: string };

  if (hostPhotoDataUrl) {
    try {
      generated = await requestOpenAiImageEdit({
        model,
        inputImageDataUrl: hostPhotoDataUrl,
        prompt,
        size,
        quality,
        user: input.ownerId
      });
    } catch (error) {
      console.warn("[ai-cover-image] edit com foto falhou, usando generation", error);
      generated = await requestOpenAiImage({
        model,
        fallbackModels: resolveFallbackModels(model),
        prompt,
        size,
        quality,
        user: input.ownerId
      });
    }
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
    includeFields: CoverIncludeFields;
  }
): CoverRequestSummary {
  return {
    eventId: event.id,
    eventTitle: event.title,
    eventType: event.eventType,
    hostName: event.hostName,
    theme: event.theme,
    date: event.date,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    eventFormat: event.eventFormat,
    venueName: event.venueName,
    city: event.city,
    onlineMeetingUrl: event.onlineMeetingUrl,
    orientation: input.orientation,
    editHint: input.editHint,
    includeFields: input.includeFields
  };
}
