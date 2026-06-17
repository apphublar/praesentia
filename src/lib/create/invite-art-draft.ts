import type { ArtStyle } from "@/lib/openai/art-styles";
import type { InviteArtSubStep } from "@/lib/create/invite-art-flow";
import type { PhotoShape, PhotoSize } from "@/lib/images/photo-zone-instructions";

export type InviteArtDraft = {
  coverMode: "ai" | "custom";
  subStep: InviteArtSubStep;
  artStyle: ArtStyle;
  coverPrompt: string;
  promptEnhancedByAi: boolean;
  includeInfo: boolean;
  inviteText: string;
  photoChoice: "include" | "skip" | null;
  photoShape: PhotoShape;
  photoPos: string;
  photoSize: PhotoSize;
  removeBackground: boolean;
  photoNotes: string;
  artApproved: boolean;
};

const storageKey = (eventId: string) => `praesentia:invite-draft:${eventId}`;

export function loadInviteArtDraft(eventId: string): InviteArtDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(eventId));
    if (!raw) return null;
    return JSON.parse(raw) as InviteArtDraft;
  } catch {
    return null;
  }
}

export function saveInviteArtDraft(eventId: string, draft: InviteArtDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(eventId), JSON.stringify(draft));
  } catch {
    // quota exceeded — ignore
  }
}

export function clearInviteArtDraft(eventId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(eventId));
}

export const coverGenerationStorageKey = (eventId: string) => `praesentia:cover-gen:${eventId}`;

export function savePendingCoverArtifact(eventId: string, artifactId: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(coverGenerationStorageKey(eventId), artifactId);
  } catch {
    // ignore
  }
}

export function loadPendingCoverArtifact(eventId: string) {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(coverGenerationStorageKey(eventId));
  } catch {
    return null;
  }
}

export function clearPendingCoverArtifact(eventId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(coverGenerationStorageKey(eventId));
}
