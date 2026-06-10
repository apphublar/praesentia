export {
  buildCoverGenerationPrompt as buildCoverImagePrompt,
  buildCoverEditWithPhotoPrompt,
  buildCoverRequestSummary,
  generateEventCoverImage as generateCoverImage,
  type CoverIncludeFields,
  type CoverRequestSummary
} from "@/lib/openai/ai-cover-image";

export { buildCoverInvitationSpec, buildPremiumCoverPrompt, formatCoverDateLine } from "@/lib/openai/cover-invitation-spec";
