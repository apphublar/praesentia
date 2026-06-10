import { getOpenAIClient, OPENAI_TEXT_MODEL } from "@/lib/openai/client";
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

function parseAssistJson(raw: string): CoverPromptAssistResult | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      visualDirection?: unknown;
      photoInstructions?: unknown;
    };
    const visualDirection =
      typeof parsed.visualDirection === "string" ? parsed.visualDirection.trim() : "";
    if (visualDirection.length < 20) return null;

    const photoInstructions =
      typeof parsed.photoInstructions === "string" && parsed.photoInstructions.trim()
        ? parsed.photoInstructions.trim()
        : null;

    return { visualDirection: visualDirection.slice(0, 1000), photoInstructions: photoInstructions?.slice(0, 400) ?? null };
  } catch {
    return null;
  }
}

export async function generateCoverPromptAssist(
  input: CoverPromptAssistInput
): Promise<CoverPromptAssistResult | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const bottomTexts = buildCoverBottomTexts(input.summary);
  const eventContext = {
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
  };

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_TEXT_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você ajuda organizadores de festas no Brasil a escrever prompts profissionais para gerar convites com IA (formato vertical 9:16). " +
            "Com base nas ideias rascunho do cliente e nos dados do evento, produza prompts claros, específicos e profissionais em português brasileiro. " +
            "Regras: " +
            "1) visualDirection descreve SOMENTE o visual da parte de cima/meio do convite (cores, estilo, elementos decorativos, mood). " +
            "2) NÃO inclua data, horário, local ou textos do rodapé em visualDirection — esses textos já serão renderizados automaticamente na parte inferior. " +
            "3) photoInstructions só quando withHostPhoto=true: descreva formato da foto (redonda, quadrada), fundo, borda, posição e tratamento. " +
            "4) Preserve a intenção do rascunho do cliente; enriqueça com detalhes visuais profissionais sem inventar tema diferente. " +
            "5) Não invente dados do evento que não foram fornecidos. " +
            'Retorne JSON: {"visualDirection":"...","photoInstructions":"..." ou null}.'
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              withHostPhoto: input.withHostPhoto,
              eventContext,
              draftOrientation: input.draftOrientation,
              draftPhotoInstructions: input.draftPhotoInstructions
            },
            null,
            2
          )
        }
      ]
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = parseAssistJson(content);
    if (!parsed) return null;

    if (!input.withHostPhoto) {
      parsed.photoInstructions = null;
    }

    return parsed;
  } catch (error) {
    console.warn("[cover-prompt-assist] falha ao gerar prompts", error);
    return null;
  }
}
