import type { InviteCopy } from "@/types/domain";

export function validateInviteCopyForContinue(copy?: Partial<InviteCopy>) {
  const missing: string[] = [];
  if (!copy?.headline?.trim()) missing.push("Título / headline");
  if (!copy?.message?.trim()) missing.push(isFundraisingMessage(copy) ? "História / descrição" : "Texto da página");
  if (!copy?.whatsapp?.trim()) missing.push("Mensagem para WhatsApp");
  return { ok: missing.length === 0, missing };
}

function isFundraisingMessage(copy?: Partial<InviteCopy>) {
  return Boolean(copy?.hashtags?.some((tag) => tag.toLowerCase().includes("vaquinha")));
}

export function inviteCopyGuidance(isFundraising: boolean) {
  if (isFundraising) {
    return "Preencha título, história e mensagem de WhatsApp. Depois você pode pedir ajuda da IA para melhorar o texto.";
  }
  return "Preencha título, texto da página e mensagem de WhatsApp. Depois você pode pedir ajuda da IA para melhorar o texto.";
}
