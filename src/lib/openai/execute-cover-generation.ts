import { repositories } from "@/lib/db";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import type { Event } from "@/types/domain";
import { generateEventCoverImage } from "@/lib/openai/ai-cover-image";
import {
  completeAiCoverUsageReservation,
  refundAiCoverUsageReservation,
  type AiCoverUsageType
} from "@/lib/openai/ai-cover-usage";
import type { CoverRequestSummary } from "@/lib/openai/cover-invitation-spec";

export type ExecuteCoverGenerationInput = {
  eventId: string;
  userId: string;
  artifactId: string;
  usageType: AiCoverUsageType;
  promptVersion: string;
  mode: "generate" | "edit";
  requestSummary: CoverRequestSummary;
  hostPhotoDataUrl?: string | null;
  charged: boolean;
  event: Event;
};

export type ExecuteCoverGenerationResult = {
  coverImageUrl: string;
  pendingUrls: string[];
  model: string;
  quota: ReturnType<typeof getAiCoverQuota>;
};

export async function executeCoverGeneration(
  input: ExecuteCoverGenerationInput
): Promise<ExecuteCoverGenerationResult> {
  const generated = await generateEventCoverImage({
    event: input.event,
    ownerId: input.userId,
    artifactId: input.artifactId,
    promptVersion: input.promptVersion,
    mode: input.mode,
    requestSummary: input.requestSummary,
    hostPhotoDataUrl: input.hostPhotoDataUrl,
    externalPhotoCompose: false
  });

  await completeAiCoverUsageReservation({
    eventId: input.eventId,
    artifactId: input.artifactId,
    imageDataUrl: generated.imageDataUrl,
    prompt: generated.prompt,
    model: generated.model,
    size: generated.size,
    quality: generated.quality,
    artifact: {
      kind: "event_cover_image",
      provider: generated.provider,
      promptVersion: input.promptVersion,
      mode: input.mode
    }
  });

  const imageUrl = generated.imageDataUrl;
  const refreshedAccount = await loadAiCoverAccountContext(input.userId);
  let evt = input.event;

  if (input.mode === "edit") {
    evt = await repositories.events.setCoverImage(input.eventId, input.userId, {
      coverImageUrl: imageUrl,
      coverSource: "ai"
    });
    return {
      coverImageUrl: imageUrl,
      pendingUrls: [],
      model: generated.model,
      quota: getAiCoverQuota(evt, refreshedAccount)
    };
  }

  const refreshedEvent = await repositories.events.findById(input.eventId);
  const updatedQuota = getAiCoverQuota(refreshedEvent as Event, refreshedAccount);
  const usesVersionCarousel = Boolean(
    updatedQuota.showVersionCarousel && updatedQuota.perEventMax && updatedQuota.perEventMax > 1
  );

  if (usesVersionCarousel) {
    const pending = [...(evt.aiCoverPendingUrls ?? []), imageUrl].slice(-updatedQuota.maxGenerations);
    evt = await repositories.events.setAiCoverPendingUrls(input.eventId, pending);
    if (pending.length === 1) {
      evt = await repositories.events.setCoverImage(input.eventId, input.userId, {
        coverImageUrl: pending[0],
        coverSource: "ai"
      });
    }
    return {
      coverImageUrl: evt.coverImageUrl ?? imageUrl,
      pendingUrls: pending,
      model: generated.model,
      quota: getAiCoverQuota(evt, refreshedAccount)
    };
  }

  evt = await repositories.events.setCoverImage(input.eventId, input.userId, {
    coverImageUrl: imageUrl,
    coverSource: "ai"
  });

  return {
    coverImageUrl: imageUrl,
    pendingUrls: [],
    model: generated.model,
    quota: getAiCoverQuota(evt, refreshedAccount)
  };
}

export async function failCoverGeneration(input: {
  eventId: string;
  userId: string;
  artifactId: string;
  usageType: AiCoverUsageType;
  charged: boolean;
  reason: string;
  event?: Event;
}) {
  await refundAiCoverUsageReservation({
    eventId: input.eventId,
    userId: input.userId,
    artifactId: input.artifactId,
    usageType: input.usageType,
    charged: input.charged,
    reason: input.reason,
    event: input.event
  });
}
