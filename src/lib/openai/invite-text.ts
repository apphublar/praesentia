import { getOpenAIClient, OPENAI_TEXT_MODEL } from "@/lib/openai/client";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event } from "@/types/domain";

export type InviteCopy = {
  headline: string;
  message: string;
  whatsapp: string;
  hashtags: string[];
};

function formatEventDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function buildLocationLine(event: Event) {
  if (event.eventFormat === "fundraising") {
    return "Contribuição via Pix (sem local físico)";
  }
  if (event.eventFormat === "online") {
    return event.onlineMeetingUrl ? `Evento online: ${event.onlineMeetingUrl}` : "Evento online";
  }
  return `${event.venueName}, ${event.venueAddress} — ${event.city}`;
}

export function buildInviteTextPrompt(event: Event, editHint?: string) {
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] ?? "evento especial";
  const editLine = editHint ? `\nAjuste solicitado pelo organizador: ${editHint}` : "";
  const exactDate = formatEventDate(event.date);
  const isFundraising = event.eventFormat === "fundraising";

  if (isFundraising) {
    return `Você escreve textos para vaquinhas online em português do Brasil, no estilo de campanhas de arrecadação solidária.

Campanha: ${event.title}
Organizador: ${event.hostName}
Tema: ${event.theme}
Prazo/meta informados: ${exactDate}${event.pix?.suggestedAmount ? ` · Meta R$ ${event.pix.suggestedAmount}` : ""}
História base: ${event.inviteCopy?.message ?? event.pix?.message ?? "Arrecadação via Pix"}${editLine}

Retorne JSON com:
- headline: frase curta (máx. 70 caracteres)
- message: história em 2 parágrafos curtos, tom humano e claro
- whatsapp: mensagem curta (máx. 280 caracteres) convidando a contribuir, termine com "Contribua aqui: {{link}}"
- hashtags: 3 a 5 hashtags em português

Use EXATAMENTE a data ${exactDate} se mencionar prazo. Não invente valores, locais ou datas diferentes.`;
  }

  return `Você escreve convites digitais em português do Brasil para a plataforma Praesentia.

Crie textos para este ${typeLabel}:
- Título: ${event.title}
- Homenageado/responsável: ${event.hostName}
- Tema/estilo: ${event.theme}
- Data EXATA: ${exactDate}
- Horário: ${event.startsAt} às ${event.endsAt}
- Local: ${buildLocationLine(event)}${editLine}

Retorne JSON com:
- headline: frase curta e calorosa (máx. 70 caracteres)
- message: texto do convite (2 parágrafos curtos, tom acolhedor, sem markdown)
- whatsapp: mensagem curta (máx. 280 caracteres), termine com "Confirme aqui: {{link}}"
- hashtags: array com 3 a 5 hashtags em português

Use EXATAMENTE a data ${exactDate} e o horário informado se mencionar quando será. Não invente dress code, presentes ou regras extras.`;
}

export async function generateInviteCopy(event: Event, editHint?: string): Promise<InviteCopy | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const response = await openai.chat.completions.create({
    model: OPENAI_TEXT_MODEL,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é redator de convites para eventos particulares no Brasil. Responda somente JSON válido com as chaves headline, message, whatsapp e hashtags. Seja conciso."
      },
      { role: "user", content: buildInviteTextPrompt(event, editHint) }
    ]
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<InviteCopy>;
    if (!parsed.headline || !parsed.message || !parsed.whatsapp) return null;

    return {
      headline: String(parsed.headline).slice(0, 120),
      message: String(parsed.message).slice(0, 2000),
      whatsapp: String(parsed.whatsapp).slice(0, 500),
      hashtags: Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((tag) => String(tag).slice(0, 40)).slice(0, 8)
        : []
    };
  } catch {
    return null;
  }
}

export function fillInviteLink(text: string, link: string) {
  return text.replace(/\{\{link\}\}/g, link);
}
