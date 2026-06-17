import { repositories } from "@/lib/db";
import { loadAiCoverAccountContext } from "@/lib/plans/ai-cover-account";
import { getAiCoverQuota } from "@/lib/plans/features";
import { failCoverGeneration } from "@/lib/openai/execute-cover-generation";
import type { AiCoverArtifactRecord } from "@/lib/db/repositories";
import type { Event } from "@/types/domain";

export const COVER_GENERATION_STALE_MS = 6 * 60_000;

export function isCoverGenerationStale(artifact: Pick<AiCoverArtifactRecord, "createdAt">, now = Date.now()) {
  return now - new Date(artifact.createdAt).getTime() > COVER_GENERATION_STALE_MS;
}

export async function refundStaleCoverReservation(eventId: string, artifact: AiCoverArtifactRecord) {
  const event = await repositories.events.findById(eventId);
  if (!event || artifact.status !== "reserved") return event;

  await failCoverGeneration({
    eventId,
    userId: artifact.userId,
    artifactId: artifact.id,
    usageType: artifact.usageType,
    charged: true,
    reason: "Reserva expirada — geração não concluída a tempo.",
    event
  });

  return repositories.events.findById(eventId);
}

export async function resolveActiveCoverGeneration(eventId: string, userId: string) {
  const account = await loadAiCoverAccountContext(userId);
  let event = await repositories.events.findById(eventId);
  if (!event) return { event: null as Event | null, account, quota: null, artifact: null as AiCoverArtifactRecord | null };

  let artifact = await repositories.aiCoverArtifacts.findLatestReservedByEvent(eventId);
  if (artifact && isCoverGenerationStale(artifact)) {
    event = (await refundStaleCoverReservation(eventId, artifact)) ?? event;
    artifact = null;
  }

  const quota = getAiCoverQuota(event, account);
  return { event, account, quota, artifact };
}
