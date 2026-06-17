import type { Event, EventType, GiftSuggestion, GuestRsvp, InviteCopy, PlanTier, UserSubscription } from "@/types/domain";

export type CreateEventInput = {
  ownerId: string;
  title: string;
  theme: string;
  eventType: EventType;
  hostName: string;
  eventFormat: Event["eventFormat"];
  onlineMeetingUrl?: string;
  date: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  venueZip?: string;
  venueComplement?: string;
  venueReference?: string;
  city: string;
  organizerName?: string;
  rsvpEnabled?: boolean;
  rsvpDeadline?: string;
  giftSuggestions?: GiftSuggestion[];
};

export type CreateGuestRsvpInput = {
  eventId: string;
  guestName: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  phone?: string;
  companionName?: string;
  companionNames?: string[];
  companionsDetail?: import("@/types/domain").GuestCompanionDetail[];
  rsvpStatus?: import("@/types/domain").GuestRsvpStatus;
  pixContributedAmount?: number;
  termsAcceptedAt?: string;
  wantsCapsule: boolean;
};

export type CreateMediaInput = {
  eventId: string;
  userId: string;
  guestRsvpId?: string;
  authorDisplayName?: string;
  type: import("@/types/domain").MediaItem["type"];
  text?: string;
  caption?: string;
  r2Key?: string;
  url?: string;
  thumbnailUrl?: string;
  byteSize?: number;
};

export type UpdateEventInput = {
  title?: string;
  theme?: string;
  hostName?: string;
  organizerName?: string;
  eventFormat?: Event["eventFormat"];
  onlineMeetingUrl?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  venueName?: string;
  venueAddress?: string;
  venueZip?: string;
  venueComplement?: string;
  venueReference?: string;
  city?: string;
  rsvpEnabled?: boolean;
  rsvpDeadline?: string | null;
  checkInNotes?: string | null;
  giftSuggestions?: GiftSuggestion[];
};

export interface UserRepository {
  findById(id: string): Promise<import("@/types/domain").User | null>;
  findByEmail(email: string): Promise<import("@/types/domain").User | null>;
  purchaseAiInvitePlan(
    userId: string,
    plan: import("@/types/domain").AiInvitePoolPlan
  ): Promise<import("@/types/domain").User>;
  consumeAiInviteGeneration(userId: string, event: import("@/types/domain").Event): Promise<void>;
  refundAiInviteGeneration(userId: string, event: import("@/types/domain").Event): Promise<void>;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findByIds(ids: string[]): Promise<Event[]>;
  findBySlugOrCode(slugOrCode: string): Promise<Event | null>;
  listByOwner(userId: string): Promise<Event[]>;
  findOwnerId(eventId: string): Promise<string | null>;
  sumFamilyStorageUsedBytes(ownerId: string): Promise<number>;
  countCapsuleEventsByOwner(userId: string, since: Date): Promise<number>;
  sumAiCoverGenerationsByOwner(userId: string, tier?: import("@/types/domain").PlanTier): Promise<number>;
  addExtraStorage(eventId: string, gb: number): Promise<Event>;
  create(input: CreateEventInput): Promise<Event>;
  patchCreationFields(
    eventId: string,
    actorUserId: string,
    input: {
      organizerName?: string;
      venueZip?: string;
      venueComplement?: string;
      venueReference?: string;
      rsvpEnabled?: boolean;
      giftSuggestions?: GiftSuggestion[];
      hostName?: string;
    }
  ): Promise<Event>;
  update(eventId: string, actorUserId: string, input: UpdateEventInput): Promise<Event>;
  activateCapsule(eventId: string, actorUserId: string, tier: Exclude<PlanTier, "free">): Promise<Event>;
  setCoverImage(
    eventId: string,
    actorUserId: string,
    input: { coverImageUrl: string; coverSource: Event["coverSource"] }
  ): Promise<Event>;
  incrementAiCoverUsage(
    eventId: string,
    actorUserId: string,
    type: "generation" | "edit"
  ): Promise<Event>;
  tryReserveAiCoverUsage(
    eventId: string,
    actorUserId: string,
    type: "generation" | "edit",
    maxAllowed: number
  ): Promise<boolean>;
  refundAiCoverUsage(
    eventId: string,
    actorUserId: string,
    type: "generation" | "edit"
  ): Promise<Event>;
  purchaseAiCoverPack(eventId: string, actorUserId: string): Promise<Event>;
  setAiCoverPendingUrls(eventId: string, urls: string[]): Promise<Event>;
  selectAiCoverVersion(eventId: string, actorUserId: string, coverImageUrl: string): Promise<Event>;
  setInviteCopy(eventId: string, actorUserId: string, inviteCopy: InviteCopy): Promise<Event>;
  writeInviteCopy(eventId: string, inviteCopy: InviteCopy): Promise<void>;
  setHostPhoto(eventId: string, actorUserId: string, hostPhotoUrl: string): Promise<Event>;
  incrementAiTextUsage(eventId: string, actorUserId: string, type: "generation" | "edit"): Promise<Event>;
  setVisibility(eventId: string, visibility: Event["visibility"], actorUserId: string): Promise<Event>;
  updatePixSettings(eventId: string, actorUserId: string, input: Event["pix"]): Promise<Event>;
  updateScreenSettings(eventId: string, actorUserId: string, input: Event["screen"]): Promise<Event>;
}

export interface MemberRepository {
  findMembership(eventId: string, userId: string): Promise<import("@/types/domain").EventMember | null>;
  listByEvent(eventId: string): Promise<import("@/types/domain").EventMember[]>;
  confirmRsvp(eventId: string, userId: string): Promise<import("@/types/domain").EventMember>;
  ensureGuestMembership(eventId: string, userId: string): Promise<import("@/types/domain").EventMember>;
  blockGuest(eventId: string, userId: string, actorUserId: string): Promise<import("@/types/domain").EventMember>;
  unblockGuest(eventId: string, userId: string, actorUserId: string): Promise<import("@/types/domain").EventMember>;
}

export interface MediaRepository {
  listPublishedByEvent(eventId: string): Promise<import("@/types/domain").MediaItem[]>;
  countPublishedByEventIds(eventIds: string[]): Promise<Record<string, number>>;
  findById(mediaId: string): Promise<import("@/types/domain").MediaItem | null>;
  create(input: CreateMediaInput): Promise<import("@/types/domain").MediaItem>;
  archive(mediaId: string, actorUserId: string): Promise<import("@/types/domain").MediaItem>;
  archiveByUser(eventId: string, userId: string, actorUserId: string): Promise<number>;
  delete(mediaId: string, actorUserId: string): Promise<void>;
  setScreenVisibility(mediaId: string, visible: boolean, actorUserId: string): Promise<import("@/types/domain").MediaItem>;
}

export interface LikeRepository {
  toggleLike(eventId: string, mediaId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  toggleGuestLike(
    eventId: string,
    mediaId: string,
    guestRsvpId: string
  ): Promise<{ liked: boolean; likesCount: number }>;
}

export interface MuralAccessRepository {
  createCode(input: {
    eventId: string;
    guestRsvpId: string;
    email: string;
    codeHash: string;
    expiresAt: string;
  }): Promise<void>;
  findLatestCode(eventId: string, email: string): Promise<{ codeHash: string; expiresAt: string; guestRsvpId: string } | null>;
  createAccessRequest(input: {
    eventId: string;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    phone?: string;
  }): Promise<import("@/types/domain").MuralAccessRequest>;
  listAccessRequests(eventId: string): Promise<import("@/types/domain").MuralAccessRequest[]>;
  updateAccessRequestStatus(
    eventId: string,
    requestId: string,
    status: "approved" | "denied"
  ): Promise<import("@/types/domain").MuralAccessRequest>;
}

export interface GuestMessageRepository {
  create(input: {
    eventId: string;
    authorName: string;
    body: string;
    visibility: "public" | "private";
  }): Promise<import("@/types/domain").GuestMessage>;
  listPublicByEvent(eventId: string): Promise<import("@/types/domain").GuestMessage[]>;
  listPrivateByEvent(eventId: string): Promise<import("@/types/domain").GuestMessage[]>;
}

export interface GuestRsvpRepository {
  create(input: CreateGuestRsvpInput): Promise<GuestRsvp>;
  listByEvent(eventId: string): Promise<GuestRsvp[]>;
  listByEventIds(eventIds: string[]): Promise<GuestRsvp[]>;
  sumPixContributions(eventId: string): Promise<number>;
  findConfirmedByEmail(eventId: string, email: string): Promise<GuestRsvp | null>;
  findById(eventId: string, rsvpId: string): Promise<GuestRsvp | null>;
  updateCompanions(eventId: string, rsvpId: string, companionNames: string[]): Promise<GuestRsvp>;
  checkIn(eventId: string, rsvpId: string, actorUserId: string): Promise<GuestRsvp>;
  undoCheckIn(eventId: string, rsvpId: string, actorUserId: string): Promise<GuestRsvp>;
}

export interface SubscriptionRepository {
  findActiveByUser(userId: string): Promise<UserSubscription | null>;
  activateFamilyPlan(userId: string): Promise<UserSubscription>;
  consumeEventSlot(userId: string): Promise<UserSubscription>;
  addExtraStorage(userId: string, gb: number): Promise<UserSubscription>;
  syncSharedStorageUsed(ownerId: string): Promise<void>;
}

export type AiCoverArtifactStatus = "reserved" | "completed" | "refunded";

export interface AiCoverArtifactRepository {
  createReserved(input: {
    eventId: string;
    userId: string;
    usageType: "generation" | "edit";
    promptVersion: string;
    requestSummary: Record<string, unknown>;
  }): Promise<string>;
  findById(artifactId: string): Promise<AiCoverArtifactRecord | null>;
  findLatestReservedByEvent(eventId: string): Promise<AiCoverArtifactRecord | null>;
  complete(
    artifactId: string,
    input: {
      imageDataUrl: string;
      prompt: string;
      model: string;
      size: string;
      quality: string;
      artifact: Record<string, unknown>;
    }
  ): Promise<void>;
  delete(artifactId: string): Promise<void>;
}

export type AiCoverArtifactRecord = {
  id: string;
  eventId: string;
  userId: string;
  usageType: "generation" | "edit";
  status: AiCoverArtifactStatus;
  imageDataUrl?: string;
  createdAt: string;
  completedAt?: string;
};

export interface AuditRepository {
  record(input: {
    actorUserId: string | null;
    eventId: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
  listBillingByActorUserId(userId: string, limit?: number): Promise<
    {
      id: string;
      actorUserId: string | null;
      eventId: string | null;
      action: string;
      targetType: string;
      targetId: string | null;
      metadata: Record<string, unknown>;
      createdAt: string;
    }[]
  >;
}
