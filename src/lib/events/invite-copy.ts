import type { InviteCopy } from "@/types/domain";

export const emptyInviteCopy: InviteCopy = {
  headline: "",
  message: "",
  whatsapp: "",
  hashtags: []
};

export function normalizeInviteCopy(raw?: Partial<InviteCopy> | null): InviteCopy | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const headline = typeof raw.headline === "string" ? raw.headline : "";
  const message = typeof raw.message === "string" ? raw.message : "";
  const whatsapp = typeof raw.whatsapp === "string" ? raw.whatsapp : "";
  const hashtags = Array.isArray(raw.hashtags)
    ? raw.hashtags.filter((tag): tag is string => typeof tag === "string")
    : [];

  if (!headline && !message && !whatsapp && hashtags.length === 0) return undefined;
  return { headline, message, whatsapp, hashtags };
}

export function resolveInviteCopy(raw?: Partial<InviteCopy> | null): InviteCopy {
  return normalizeInviteCopy(raw) ?? emptyInviteCopy;
}

export function previewWhatsappMessage(whatsapp: string | undefined, eventLink: string) {
  const text = whatsapp ?? "";
  if (text.includes("{{link}}")) return text.replace(/\{\{link\}\}/g, eventLink);
  if (text.trim()) return `${text} ${eventLink}`;
  return eventLink;
}
