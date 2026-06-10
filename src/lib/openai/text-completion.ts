import type OpenAI from "openai";
import { OPENAI_TEXT_MODEL } from "@/lib/openai/client";

const DEFAULT_TEXT_MODEL_FALLBACKS = ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"];

export function resolveTextModels() {
  const configured = OPENAI_TEXT_MODEL.trim();
  const fromEnv = (process.env.OPENAI_TEXT_FALLBACK_MODEL ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [...new Set([configured, ...fromEnv, ...DEFAULT_TEXT_MODEL_FALLBACKS].filter(Boolean))];
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableTextModelError(error: unknown) {
  const combined = errorText(error).toLowerCase();
  return /model|not found|unsupported|invalid|permission|access|does not exist|404/.test(combined);
}

function isRetryableWithoutJsonMode(error: unknown) {
  const combined = errorText(error).toLowerCase();
  return /json|response_format|structured|unsupported|invalid/.test(combined);
}

export type TextCompletionParams = Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, "model">;

export async function createTextCompletionWithFallback(
  openai: OpenAI,
  params: TextCompletionParams
) {
  const models = resolveTextModels();
  let lastError: unknown;

  for (const model of models) {
    try {
      return await openai.chat.completions.create({ ...params, model });
    } catch (error) {
      lastError = error;
      if (!isRetryableTextModelError(error)) throw error;
      console.warn(`[openai-text] modelo ${model} indisponível`, errorText(error));
    }
  }

  throw lastError;
}

export async function createJsonTextCompletionWithFallback(
  openai: OpenAI,
  params: TextCompletionParams
) {
  try {
    return await createTextCompletionWithFallback(openai, {
      ...params,
      response_format: { type: "json_object" }
    });
  } catch (error) {
    if (!isRetryableWithoutJsonMode(error)) throw error;
    console.warn("[openai-text] json_object indisponível, tentando sem response_format", errorText(error));
    return createTextCompletionWithFallback(openai, params);
  }
}

export function describeOpenAiFailure(error: unknown) {
  const message = errorText(error);
  const lower = message.toLowerCase();

  if (/insufficient_quota|billing|payment|credit/.test(lower)) {
    return "Cota ou billing da OpenAI indisponível. Verifique sua conta OpenAI.";
  }
  if (/rate limit|429/.test(lower)) {
    return "OpenAI temporariamente ocupada. Aguarde alguns segundos e tente de novo.";
  }
  if (/model|not found|does not exist|unsupported/.test(lower)) {
    return "Modelo de texto indisponível. Ajuste OPENAI_TEXT_MODEL (ex.: gpt-4o-mini) na Vercel.";
  }
  if (/invalid_api_key|authentication|401/.test(lower)) {
    return "OPENAI_API_KEY inválida ou expirada.";
  }

  return "Falha ao consultar a OpenAI. Tente novamente em instantes.";
}
