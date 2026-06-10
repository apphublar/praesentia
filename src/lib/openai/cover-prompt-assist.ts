import { getOpenAIClient } from "@/lib/openai/client";
import {
  createJsonTextCompletionWithFallback,
  describeOpenAiFailure
} from "@/lib/openai/text-completion";
import {
  buildCoverBottomTexts,
  type CoverRequestSummary
} from "@/lib/openai/cover-invitation-spec";

export type CoverPromptAssistInput = {
  summary: CoverRequestSummary;
  draftOrientation: string;
  draftPhotoInstructions: string;
  withHostPhoto: boolean;
};

export type CoverPromptAssistResult = {
  visualDirection: string;
  photoInstructions: string | null;
};

export type CoverPromptAssistFailure = {
  reason: "openai_not_configured" | "empty_response" | "parse_failed" | "openai_error";
  detail?: string;
};

const VISUAL_DIRECTION_KEYS = [
  "visualDirection",
  "visual_direction",
  "orientacaoVisual",
  "orientacao_visual",
  "direcaoVisual",
  "direcao_visual",
  "orientacao",
  "promptVisual",
  "prompt_visual"
] as const;

const PHOTO_INSTRUCTION_KEYS = [
  "photoInstructions",
  "photo_instructions",
  "instrucoesFoto",
  "instrucoes_foto",
  "instrucoesDaFoto",
  "instrucoes_da_foto",
  "foto",
  "photo"
] as const;

function pickNestedString(value: unknown, keys: readonly string[]): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const normalizedEntries = Object.entries(record).map(([key, val]) => [key.toLowerCase(), val] as const);
  for (const key of keys) {
    const match = normalizedEntries.find(([entryKey]) => entryKey === key.toLowerCase());
    if (match && typeof match[1] === "string" && match[1].trim()) {
      return match[1].trim();
    }
  }

  for (const nested of Object.values(record)) {
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const found = pickNestedString(nested, keys);
      if (found) return found;
    }
  }

  return null;
}

function parseAssistJson(raw: string): CoverPromptAssistResult | null {
  const trimmed = raw.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.unshift(fenced[1].trim());

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) candidates.push(jsonMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      const visualDirection = pickNestedString(parsed, VISUAL_DIRECTION_KEYS);
      if (!visualDirection || visualDirection.length < 8) continue;

      const photoInstructions = pickNestedString(parsed, PHOTO_INSTRUCTION_KEYS);

      return {
        visualDirection: visualDirection.slice(0, 1000),
        photoInstructions: photoInstructions?.slice(0, 400) ?? null
      };
    } catch {
      // try next candidate
    }
  }

  return null;
}

function buildAssistUserMessage(input: CoverPromptAssistInput) {
  const bottomTexts = buildCoverBottomTexts(input.summary);

  return JSON.stringify(
    {
      withHostPhoto: input.withHostPhoto,
      eventContext: {
        eventTitle: input.summary.eventTitle,
        eventType: input.summary.eventType,
        hostName: input.summary.hostName,
        theme: input.summary.theme,
        date: input.summary.date,
        startsAt: input.summary.startsAt,
        endsAt: input.summary.endsAt,
        eventFormat: input.summary.eventFormat,
        venueName: input.summary.venueName,
        city: input.summary.city,
        bottomTexts
      },
      draftOrientation: input.draftOrientation,
      draftPhotoInstructions: input.draftPhotoInstructions
    },
    null,
    2
  );
}

const ASSIST_SYSTEM_PROMPT =
  "Você ajuda organizadores de festas no Brasil a escrever prompts profissionais para gerar convites com IA (formato vertical 9:16). " +
  "Com base nas ideias rascunho do cliente e nos dados do evento, produza prompts claros, específicos e profissionais em português brasileiro. " +
  "Regras: " +
  "1) visualDirection descreve SOMENTE o visual da parte de cima/meio do convite (cores, estilo, elementos decorativos, mood). " +
  "2) NÃO inclua data, horário, local ou textos do rodapé em visualDirection — esses textos já serão renderizados automaticamente na parte inferior. " +
  "3) photoInstructions só quando withHostPhoto=true: descreva formato da foto (redonda, quadrada), fundo, borda, posição e tratamento. " +
  "4) Preserve a intenção do rascunho do cliente; enriqueça com detalhes visuais profissionais sem inventar tema diferente. " +
  "5) Não invente dados do evento que não foram fornecidos. " +
  "Responda SOMENTE um JSON válido com as chaves exatas visualDirection (string) e photoInstructions (string ou null).";

function buildLocalPromptFallback(input: CoverPromptAssistInput): CoverPromptAssistResult {
  const theme = input.summary.theme?.trim();
  const hostName = input.summary.hostName?.trim();
  const draft = input.draftOrientation.trim();
  const photoDraft = input.draftPhotoInstructions.trim();

  const visualParts: string[] = [];
  if (draft) visualParts.push(draft);
  if (theme && !draft.toLowerCase().includes(theme.toLowerCase())) {
    visualParts.unshift(`Tema visual: ${theme}.`);
  }
  if (hostName && !draft.toLowerCase().includes(hostName.toLowerCase())) {
    visualParts.push(`Celebração especial para ${hostName}.`);
  }
  if (!visualParts.length && theme) {
    visualParts.push(`Convite festivo com tema ${theme}, paleta harmoniosa e visual premium.`);
  }

  return {
    visualDirection: visualParts.join(" ").slice(0, 1000),
    photoInstructions: input.withHostPhoto ? photoDraft.slice(0, 400) || null : null
  };
}

export async function generateCoverPromptAssist(
  input: CoverPromptAssistInput
): Promise<CoverPromptAssistResult | null> {
  const failure = await generateCoverPromptAssistDetailed(input);
  return failure.ok ? failure.result : null;
}

export async function generateCoverPromptAssistDetailed(
  input: CoverPromptAssistInput
): Promise<
  | { ok: true; result: CoverPromptAssistResult }
  | { ok: false; failure: CoverPromptAssistFailure }
> {
  const openai = getOpenAIClient();
  if (!openai) {
    return { ok: false, failure: { reason: "openai_not_configured" } };
  }

  const userMessage = buildAssistUserMessage(input);

  try {
    const response = await createJsonTextCompletionWithFallback(openai, {
      temperature: 0.4,
      messages: [
        { role: "system", content: ASSIST_SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ]
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      const fallback = buildLocalPromptFallback(input);
      if (fallback.visualDirection.length >= 8) {
        return { ok: true, result: fallback };
      }
      return { ok: false, failure: { reason: "empty_response" } };
    }

    const parsed = parseAssistJson(content);
    if (parsed) {
      if (!input.withHostPhoto) parsed.photoInstructions = null;
      return { ok: true, result: parsed };
    }

    console.warn("[cover-prompt-assist] parse_failed", content.slice(0, 500));
    const fallback = buildLocalPromptFallback(input);
    if (fallback.visualDirection.length >= 8) {
      return { ok: true, result: fallback };
    }

    return { ok: false, failure: { reason: "parse_failed", detail: content.slice(0, 200) } };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn("[cover-prompt-assist] openai_error", detail);

    const fallback = buildLocalPromptFallback(input);
    if (fallback.visualDirection.length >= 8) {
      return { ok: true, result: fallback };
    }

    return { ok: false, failure: { reason: "openai_error", detail } };
  }
}

export { describeOpenAiFailure };
