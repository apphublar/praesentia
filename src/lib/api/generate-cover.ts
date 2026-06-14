import { apiErrorMessage, dashboardFetchJson, DashboardApiError } from "@/lib/api/dashboard-fetch";
import type { CoverQuota } from "@/components/dashboard/cover-generator";

const COVER_GENERATION_TIMEOUT_MS = 300_000;

export type GenerateCoverInput = {
  eventId: string;
  mode?: "generate" | "edit" | "select";
  editHint?: string;
  orientation?: string;
  photoInstructions?: string;
  coverFields?: Record<string, string>;
  primaryPhotoDataUrl?: string | null;
  /** @deprecated A foto é enviada via primaryPhotoDataUrl para geração integrada por IA. */
  externalPhotoCompose?: boolean;
  coverImageUrl?: string;
  promptVersion?: string;
};

export type GenerateCoverResult = {
  coverImageUrl?: string;
  pendingUrls?: string[];
  quota?: CoverQuota;
  artifactId?: string;
  model?: string;
  error?: string;
};

export async function generateEventCoverImageClient(input: GenerateCoverInput): Promise<GenerateCoverResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), COVER_GENERATION_TIMEOUT_MS);

  try {
    const response = await fetch(`/api/events/${input.eventId}/generate-cover`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: input.mode ?? "generate",
        editHint: input.editHint,
        orientation: input.orientation,
        photoInstructions: input.photoInstructions,
        coverFields: input.coverFields,
        primaryPhotoDataUrl: input.primaryPhotoDataUrl,
        externalPhotoCompose: input.externalPhotoCompose,
        coverImageUrl: input.coverImageUrl,
        promptVersion: input.promptVersion
      }),
      signal: controller.signal
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (response.status === 402) {
      return { error: String(data.error ?? "Limite de gerações por IA atingido.") };
    }

    if (!response.ok) {
      return { error: String(data.error ?? "Erro ao gerar imagem.") };
    }

    return {
      coverImageUrl: typeof data.coverImageUrl === "string" ? data.coverImageUrl : undefined,
      pendingUrls: Array.isArray(data.pendingUrls) ? (data.pendingUrls as string[]) : undefined,
      quota: data.quota as CoverQuota | undefined,
      artifactId: typeof data.artifactId === "string" ? data.artifactId : undefined,
      model: typeof data.model === "string" ? data.model : undefined
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { error: "A criação da imagem demorou mais do que o esperado. Tente novamente." };
    }
    return { error: apiErrorMessage(error, "Erro de conexão. Tente novamente.") };
  } finally {
    clearTimeout(timeout);
  }
}

export async function selectCoverVersionClient(eventId: string, coverImageUrl: string) {
  const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover`, {
    method: "POST",
    body: JSON.stringify({ mode: "select", coverImageUrl })
  });
  if (!response.ok) {
    throw new DashboardApiError(response.status, String(data.error ?? "Erro ao selecionar versão."));
  }
  return data;
}
