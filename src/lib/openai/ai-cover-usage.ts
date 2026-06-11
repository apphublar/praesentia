import { repositories } from "@/lib/db";
import { getAiCoverQuota, isAiCoverTestingUnlimited } from "@/lib/plans/features";
import type { Event } from "@/types/domain";

export type AiCoverUsageType = "generation" | "edit";

export type ReserveAiCoverUsageInput = {
  event: Event;
  userId: string;
  usageType: AiCoverUsageType;
  promptVersion: string;
  requestSummary: Record<string, unknown>;
  skipCharge?: boolean;
};

export type ReserveAiCoverUsageResult = {
  allowed: boolean;
  message: string;
  artifactId?: string;
  charged?: boolean;
  quota?: ReturnType<typeof getAiCoverQuota>;
};

export async function reserveAiCoverUsage(input: ReserveAiCoverUsageInput): Promise<ReserveAiCoverUsageResult> {
  const quota = getAiCoverQuota(input.event);
  const skipCharge = input.skipCharge || isAiCoverTestingUnlimited();

  if (!skipCharge) {
    if (input.usageType === "generation" && !quota.canGenerate) {
      return {
        allowed: false,
        message: quota.canPurchasePack
          ? "Limite de gerações por IA atingido. Desbloqueie o pacote extra (R$ 4,90) para mais 2 versões."
          : "Limite de gerações por IA atingido."
      };
    }
    if (input.usageType === "edit" && !quota.canEdit) {
      return {
        allowed: false,
        message: quota.canPurchasePack
          ? "Ajustes com IA estão no pacote extra (R$ 4,90): +2 imagens e +2 ajustes."
          : "Limite de ajustes por IA atingido."
      };
    }
  }

  const artifactId = await repositories.aiCoverArtifacts.createReserved({
    eventId: input.event.id,
    userId: input.userId,
    usageType: input.usageType,
    promptVersion: input.promptVersion,
    requestSummary: input.requestSummary
  });

  let charged = false;
  if (!skipCharge) {
    const reserved = await repositories.events.tryReserveAiCoverUsage(
      input.event.id,
      input.userId,
      input.usageType,
      input.usageType === "generation" ? quota.maxGenerations : quota.maxEdits
    );
    if (!reserved) {
      await repositories.aiCoverArtifacts.delete(artifactId);
      return {
        allowed: false,
        message: input.usageType === "generation"
          ? "Limite de gerações por IA atingido."
          : "Limite de ajustes por IA atingido."
      };
    }
    charged = true;
  }

  const updatedEvent = await repositories.events.findById(input.event.id);
  return {
    allowed: true,
    message: "Reserva confirmada.",
    artifactId,
    charged,
    quota: updatedEvent ? getAiCoverQuota(updatedEvent) : quota
  };
}

export async function completeAiCoverUsageReservation(input: {
  eventId: string;
  artifactId: string;
  imageDataUrl: string;
  prompt: string;
  model: string;
  size: string;
  quality: string;
  artifact: Record<string, unknown>;
}) {
  await repositories.aiCoverArtifacts.complete(input.artifactId, {
    imageDataUrl: input.imageDataUrl,
    prompt: input.prompt,
    model: input.model,
    size: input.size,
    quality: input.quality,
    artifact: input.artifact
  });
}

export async function refundAiCoverUsageReservation(input: {
  eventId: string;
  userId: string;
  artifactId?: string;
  usageType: AiCoverUsageType;
  charged: boolean;
  reason: string;
}) {
  if (input.artifactId) {
    try {
      await repositories.aiCoverArtifacts.delete(input.artifactId);
    } catch (error) {
      console.error("[ai-cover-usage] falha ao remover artefato parcial", error);
    }
  }

  if (input.charged) {
    try {
      await repositories.events.refundAiCoverUsage(input.eventId, input.userId, input.usageType);
    } catch (error) {
      console.error("[ai-cover-usage] falha ao estornar cota", input.reason, error);
    }
  }
}
