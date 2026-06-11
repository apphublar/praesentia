import { buildAppImageUrl } from "@/lib/openai/persist-image";

export function resolveMediaItemUrl(
  eventId: string,
  item: { r2Key?: string; url?: string; thumbnailUrl?: string }
) {
  if (item.r2Key) return buildAppImageUrl(eventId, item.r2Key);
  const candidate = item.thumbnailUrl || item.url;
  if (!candidate) return null;
  if (candidate.includes("placeholder-photo") || candidate.includes("placeholder-video")) return null;
  return candidate;
}

export function resolveStoredMediaUrl(eventId: string, key: string, publicUrl: string | null) {
  return publicUrl || buildAppImageUrl(eventId, key);
}
