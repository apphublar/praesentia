import { sanitizeText } from "@/lib/security/sanitize";
import type { GiftSuggestion } from "@/types/domain";

export function createGiftSuggestionId() {
  return `gift_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeGiftSuggestions(raw: unknown, maxItems = 12): GiftSuggestion[] {
  if (!Array.isArray(raw)) return [];
  const items: GiftSuggestion[] = [];

  for (const [index, item] of raw.entries()) {
    if (items.length >= maxItems) break;
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = sanitizeText(row.title, 120);
    if (!title) continue;
    items.push({
      id: sanitizeText(row.id, 64) || `gift_${index}`,
      title,
      note: row.note ? sanitizeText(row.note, 500) : undefined,
      linkUrl: row.linkUrl ? sanitizeText(row.linkUrl, 400) : undefined,
      imageUrl: row.imageUrl ? sanitizeText(row.imageUrl, 500) : undefined
    });
  }

  return items;
}
