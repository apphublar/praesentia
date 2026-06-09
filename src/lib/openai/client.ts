import OpenAI from "openai";

let client: OpenAI | null = null;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL?.trim() || "gpt-4o-mini";
/** Modelo mais recente da OpenAI para geração de imagens (abril/2026). */
export const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-2";

export function isGptImageModel(model: string) {
  return model.startsWith("gpt-image");
}
