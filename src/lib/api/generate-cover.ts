import { apiErrorMessage, dashboardFetchJson, DashboardApiError } from "@/lib/api/dashboard-fetch";
import {
  clearPendingCoverArtifact,
  savePendingCoverArtifact
} from "@/lib/create/invite-art-draft";
import type { CoverQuota } from "@/components/dashboard/cover-generator";

const COVER_POLL_INTERVAL_MS = 3_000;
const COVER_POLL_TIMEOUT_MS = 300_000;

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
  /** Quando true (padrão), a geração roda no servidor e o cliente faz polling. */
  background?: boolean;
};

export type GenerateCoverResult = {
  status?: "processing" | "completed" | "failed" | "idle";
  coverImageUrl?: string;
  pendingUrls?: string[];
  quota?: CoverQuota;
  artifactId?: string;
  model?: string;
  error?: string;
  needsUpgrade?: boolean;
};

export type CoverGenerationStatus = GenerateCoverResult & {
  status: "processing" | "completed" | "failed" | "idle";
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchCoverGenerationStatus(
  eventId: string,
  artifactId?: string
): Promise<CoverGenerationStatus> {
  const query = artifactId ? `?artifactId=${encodeURIComponent(artifactId)}` : "";
  const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover${query}`);
  if (!response.ok) {
    throw new DashboardApiError(response.status, String(data.error ?? "Erro ao consultar geração."));
  }
  return data as CoverGenerationStatus;
}

export async function pollCoverGenerationUntilDone(
  eventId: string,
  artifactId: string,
  options?: { onTick?: (status: CoverGenerationStatus) => void; signal?: AbortSignal }
): Promise<GenerateCoverResult> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < COVER_POLL_TIMEOUT_MS) {
    if (options?.signal?.aborted) {
      return { status: "processing", artifactId, error: "Consulta interrompida." };
    }

    try {
      const status = await fetchCoverGenerationStatus(eventId, artifactId);
      options?.onTick?.(status);

      if (status.status === "completed") {
        return {
          status: "completed",
          artifactId,
          coverImageUrl: status.coverImageUrl,
          pendingUrls: status.pendingUrls,
          quota: status.quota
        };
      }

      if (status.status === "failed") {
        return {
          status: "failed",
          artifactId,
          error: status.error ?? "Não foi possível concluir a imagem."
        };
      }

      if (status.status === "idle") {
        return {
          status: "failed",
          artifactId,
          error: "A geração foi interrompida. Tente novamente."
        };
      }
    } catch (error) {
      if (options?.signal?.aborted) {
        return { status: "processing", artifactId };
      }
      console.warn("[pollCoverGeneration]", error);
    }

    await sleep(COVER_POLL_INTERVAL_MS);
  }

  return {
    status: "processing",
    artifactId,
    error: "Ainda estamos criando sua imagem. Volte em instantes — ela continuará sendo gerada."
  };
}

export async function generateEventCoverImageClient(input: GenerateCoverInput): Promise<GenerateCoverResult> {
  const useBackground = input.background !== false && input.mode !== "select";

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
        promptVersion: input.promptVersion,
        background: useBackground
      })
    });

    const text = await response.text();
    const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (response.status === 402) {
      return {
        error: String(data.error ?? "Limite de gerações por IA atingido."),
        needsUpgrade: data.needsUpgrade === true
      };
    }

    if (!response.ok && response.status !== 202) {
      return { error: String(data.error ?? "Erro ao gerar imagem.") };
    }

    const artifactId = typeof data.artifactId === "string" ? data.artifactId : undefined;

    if (useBackground && response.status === 202 && artifactId) {
      savePendingCoverArtifact(input.eventId, artifactId);
      const polled = await pollCoverGenerationUntilDone(input.eventId, artifactId);
      if (polled.status === "completed") {
        clearPendingCoverArtifact(input.eventId);
      }
      return polled;
    }

    if (!response.ok) {
      return { error: String(data.error ?? "Erro ao gerar imagem.") };
    }

    return {
      status: data.status === "completed" ? "completed" : undefined,
      coverImageUrl: typeof data.coverImageUrl === "string" ? data.coverImageUrl : undefined,
      pendingUrls: Array.isArray(data.pendingUrls) ? (data.pendingUrls as string[]) : undefined,
      quota: data.quota as CoverQuota | undefined,
      artifactId,
      model: typeof data.model === "string" ? data.model : undefined
    };
  } catch (error) {
    return { error: apiErrorMessage(error, "Erro de conexão. Tente novamente.") };
  }
}

export async function resumeCoverGenerationClient(
  eventId: string,
  artifactId: string,
  options?: { onTick?: (status: CoverGenerationStatus) => void; signal?: AbortSignal }
) {
  const initial = await fetchCoverGenerationStatus(eventId, artifactId);
  if (initial.status === "completed") {
    return {
      status: "completed" as const,
      artifactId,
      coverImageUrl: initial.coverImageUrl,
      pendingUrls: initial.pendingUrls,
      quota: initial.quota
    };
  }
  if (initial.status === "failed") {
    clearPendingCoverArtifact(eventId);
    return {
      status: "failed" as const,
      artifactId,
      error: initial.error ?? "Não foi possível concluir a imagem."
    };
  }
  const polled = await pollCoverGenerationUntilDone(eventId, artifactId, options);
  if (polled.status === "completed") {
    clearPendingCoverArtifact(eventId);
  }
  return polled;
}

export async function selectCoverVersionClient(eventId: string, coverImageUrl: string) {
  const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover`, {
    method: "POST",
    body: JSON.stringify({ mode: "select", coverImageUrl, background: false })
  });
  if (!response.ok) {
    throw new DashboardApiError(response.status, String(data.error ?? "Erro ao selecionar versão."));
  }
  return data;
}
