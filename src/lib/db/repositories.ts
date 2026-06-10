import type { Event, EventType, GuestRsvp, InviteCopy, PlanTier, UserSubscription } from "@/types/domain";

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
  city: string;
};

export type CreateGuestRsvpInput = {
  eventId: string;
  guestName: string;
  phone?: string;
  wantsCapsule: boolean;
};

export type CreateMediaInput = {
  eventId: string;
  userId: string;
  type: import("@/types/domain").MediaItem["type"];
  text?: string;
  r2Key?: string;
  url?: string;
  thumbnailUrl?: string;
  byteSize?: number;
};

export type UpdateEventInput = {
  title?: string;
  theme?: string;
  hostName?: string;
  eventFormat?: Event["eventFormat"];
  onlineMeetingUrl?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
};

export interface UserRepository {
  findById(id: string): Promise<import("@/types/domain").User | null>;
  findByEmail(email: string): Promise<import("@/types/domain").User | null>;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlugOrCode(slugOrCode: string): Promise<Event | null>;
  listByOwner(userId: string): Promise<Event[]>;
  findOwnerId(eventId: string): Promise<string | null>;
  sumFamilyStorageUsedBytes(ownerId: string): Promise<number>;
  countCapsuleEventsByOwner(userId: string, since: Date): Promise<number>;
  addExtraStorage(eventId: string, gb: number): Promise<Event>;
  create(input: CreateEventInput): Promise<Event>;
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
  setAiCoverPendingUrls(eventId: string, urls: string[]): Promise<Event>;
  selectAiCoverVersion(eventId: string, actorUserId: string, coverImageUrl: string): Promise<Event>;
  setInviteCopy(eventId: string, actorUserId: string, inviteCopy: InviteCopy): Promise<Event>;
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
  findById(mediaId: string): Promise<import("@/types/domain").MediaItem | null>;
  create(input: CreateMediaInput): Promise<import("@/types/domain").MediaItem>;
  archive(mediaId: string, actorUserId: string): Promise<import("@/types/domain").MediaItem>;
  archiveByUser(eventId: string, userId: string, actorUserId: string): Promise<number>;
  delete(mediaId: string, actorUserId: string): Promise<void>;
  setScreenVisibility(mediaId: string, visible: boolean, actorUserId: string): Promise<import("@/types/domain").MediaItem>;
}

export interface LikeRepository {
  toggleLike(eventId: string, mediaId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
}

export interface GuestRsvpRepository {
  create(input: CreateGuestRsvpInput): Promise<GuestRsvp>;
  listByEvent(eventId: string): Promise<GuestRsvp[]>;
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

export interface AuditRepository {
  record(input: {
    actorUserId: string | null;
    eventId: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
