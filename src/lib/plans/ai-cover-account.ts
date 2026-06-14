import { repositories } from "@/lib/db";
import type { AiCoverAccountContext } from "@/lib/plans/features";

export async function loadAiCoverAccountContext(userId: string): Promise<AiCoverAccountContext> {
  const user = await repositories.users.findById(userId);
  const familyGenerationsUsed = await repositories.events.sumAiCoverGenerationsByOwner(userId, "family");
  const freeGenerationsUsed = await repositories.events.sumAiCoverGenerationsByOwner(userId);

  return {
    freeVersionUsed: Boolean(user?.aiInviteFreeUsed || freeGenerationsUsed > 0),
    invitePoolRemaining: user?.aiInvitePoolRemaining ?? 0,
    invitePoolPlan: user?.aiInvitePoolPlan,
    familyGenerationsUsed
  };
}
