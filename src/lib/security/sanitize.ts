export function sanitizeText(input: unknown, maxLength = 1000) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function normalizeExternalUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

export function sanitizeUrl(input: unknown, maxLength = 400) {
  if (typeof input !== "string") return undefined;
  const cleaned = input.replace(/[<>]/g, "").trim().slice(0, maxLength);
  if (!cleaned) return undefined;
  return normalizeExternalUrl(cleaned);
}

/** Preserva quebras de linha — use em instruções estruturadas (ex.: zona da foto). */
export function sanitizeMultilineText(input: unknown, maxLength = 2500) {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function isValidPixKey(input: string) {
  const value = input.trim();
  if (!value || value.length > 120) return false;
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const phoneLike = /^\+?\d{10,14}$/.test(value.replace(/\D/g, ""));
  const cpfCnpjLike = /^\d{11}$|^\d{14}$/.test(value.replace(/\D/g, ""));
  const randomKeyLike = /^[0-9a-fA-F-]{32,36}$/.test(value);
  return emailLike || phoneLike || cpfCnpjLike || randomKeyLike;
}

export function isSafeSlug(input: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,50}[a-z0-9])?$/.test(input);
}
