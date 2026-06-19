import { BILLING_AUDIT_ACTIONS } from "@/lib/billing/payment-history";
import { events, mediaItems, members, users } from "@/lib/mock-data";
import { randomUUID } from "node:crypto";
import type {
  AiCoverArtifactRepository,
  AuditRepository,
  CreateEventInput,
  CreateGuestRsvpInput,
  CreateMediaInput,
  EventRepository,
  GuestMessageRepository,
  GuestRsvpRepository,
  LikeRepository,
  MuralAccessRepository,
  MediaRepository,
  MemberRepository,
  PhotoAlbumOrderRepository,
  SubscriptionRepository,
  UpdateEventInput,
  UserRepository
} from "@/lib/db/repositories";
import { PLANS } from "@/lib/plans";
import type { PhotoAlbumOrder } from "@/lib/album/order-types";
import type { PhotoAlbumDraft } from "@/lib/album/types";
import type { Event, GuestMessage, GuestRsvp, MediaItem, MuralAccessRequest, PlanTier, UserSubscription } from "@/types/domain";

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

function baseEventFields(input: CreateEventInput) {
  return {
    eventFormat: input.eventFormat,
    onlineMeetingUrl: input.onlineMeetingUrl,
    aiCoverGenerationsCount: 0,
    aiCoverEditsCount: 0,
    aiCoverPackBonusGenerations: 0,
    aiCoverPackBonusEdits: 0,
    aiTextGenerationsCount: 0,
    aiTextEditsCount: 0,
    aiCoverPendingUrls: [] as string[],
    capsuleActivatedAt: undefined as string | undefined
  };
}

export const inMemoryUsers: UserRepository = {
  async findById(id) {
    return users.find((user) => user.id === id) ?? null;
  },
  async findByEmail(email) {
    return users.find((user) => user.email === email) ?? null;
  },
  async purchaseAiInvitePlan(userId, plan) {
    const user = users.find((item) => item.id === userId);
    if (!user) throw new Error("USER_NOT_FOUND");
    const versions = plan === "inspiracao" ? 5 : 15;
    user.aiInvitePoolRemaining = (user.aiInvitePoolRemaining ?? 0) + versions;
    user.aiInvitePoolPlan = plan;
    return user;
  },
  async consumeAiInviteGeneration(userId, event) {
    if (event.capsuleActivatedAt) return;
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    if ((user.aiInvitePoolRemaining ?? 0) > 0) {
      user.aiInvitePoolRemaining = Math.max(0, (user.aiInvitePoolRemaining ?? 0) - 1);
      return;
    }
    user.aiInviteFreeUsed = true;
  },
  async refundAiInviteGeneration(userId, event) {
    if (event.capsuleActivatedAt) return;
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    if (user.aiInvitePoolPlan) {
      user.aiInvitePoolRemaining = (user.aiInvitePoolRemaining ?? 0) + 1;
      return;
    }
    user.aiInviteFreeUsed = false;
  }
};

export const inMemoryEvents: EventRepository = {
  async findById(id) {
    return events.find((event) => event.id === id) ?? null;
  },
  async findByIds(ids) {
    const idSet = new Set(ids);
    return events.filter((event) => idSet.has(event.id));
  },
  async findBySlugOrCode(slugOrCode) {
    return events.find((event) => event.slug === slugOrCode || event.freeCode === slugOrCode) ?? null;
  },
  async findOwnerId(eventId) {
    const owner = members.find((member) => member.eventId === eventId && member.role === "owner");
    return owner?.userId ?? null;
  },
  async sumFamilyStorageUsedBytes(ownerId) {
    const ownedIds = new Set(
      members.filter((member) => member.userId === ownerId && member.role === "owner").map((member) => member.eventId)
    );
    return events
      .filter(
        (event) =>
          ownedIds.has(event.id) && event.plan.tier === "family" && Boolean(event.capsuleActivatedAt)
      )
      .reduce((sum, event) => sum + event.storageUsedBytes, 0);
  },
  async addExtraStorage(eventId, gb) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.extraStorageGb += gb;
    return event;
  },
  async listByOwner(userId) {
    const manageableEventIds = new Set(
      members
        .filter((member) => member.userId === userId && (member.role === "owner" || member.role === "manager"))
        .map((member) => member.eventId)
    );
    return events.filter((event) => manageableEventIds.has(event.id));
  },
  async countCapsuleEventsByOwner(userId, since) {
    const ownedIds = new Set(
      members.filter((member) => member.userId === userId && member.role === "owner").map((member) => member.eventId)
    );
    return events.filter(
      (event) =>
        ownedIds.has(event.id) &&
        event.plan.tier === "family" &&
        event.capsuleActivatedAt &&
        new Date(event.capsuleActivatedAt) >= since
    ).length;
  },
  async sumAiCoverGenerationsByOwner(userId, tier) {
    const ownedIds = new Set(
      members.filter((member) => member.userId === userId && member.role === "owner").map((member) => member.eventId)
    );
    return events
      .filter((event) => {
        if (!ownedIds.has(event.id)) return false;
        if (tier === "family") {
          return event.plan.tier === "family" && Boolean(event.capsuleActivatedAt);
        }
        return !event.capsuleActivatedAt;
      })
      .reduce((sum, event) => sum + event.aiCoverGenerationsCount, 0);
  },
  async create(input: CreateEventInput) {
    const eventId = createId("evt");
    const baseSlug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "evento";
    let slug = baseSlug;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      if (!events.some((event) => event.slug === candidate)) {
        slug = candidate;
        break;
      }
    }
    const event: Event = {
      id: eventId,
      slug,
      freeCode: Math.random().toString(36).slice(2, 8),
      title: input.title,
      theme: input.theme,
      eventType: input.eventType,
      hostName: input.hostName || users.find((user) => user.id === input.ownerId)?.name || "Responsável",
      organizerName: input.organizerName,
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      venueZip: input.venueZip,
      venueComplement: input.venueComplement,
      venueReference: input.venueReference,
      city: input.city,
      rsvpEnabled: input.rsvpEnabled !== false,
      rsvpDeadline: input.rsvpDeadline,
      giftSuggestions: input.giftSuggestions ?? [],
      visibility: "private",
      phase: "before",
      plan: PLANS.free,
      storageUsedBytes: 0,
      storageUsedGb: 0,
      extraStorageGb: 0,
      ...baseEventFields(input),
      screen: {
        enabled: false,
        token: createId("screen"),
        paused: false,
        showQrCode: true,
        showVideos: true,
        showMessages: true,
        layout: "recent_plus_top3"
      }
    };
    events.push(event);
    members.push({
      id: createId("mem"),
      eventId,
      userId: input.ownerId,
      role: "owner",
      rsvpStatus: "confirmed",
      accessStatus: "active",
      joinedAt: new Date().toISOString()
    });
    return event;
  },
  async patchCreationFields(eventId, _actorUserId, input) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (input.organizerName !== undefined) event.organizerName = input.organizerName;
    if (input.venueZip !== undefined) event.venueZip = input.venueZip;
    if (input.venueComplement !== undefined) event.venueComplement = input.venueComplement;
    if (input.venueReference !== undefined) event.venueReference = input.venueReference;
    if (input.rsvpEnabled !== undefined) event.rsvpEnabled = input.rsvpEnabled;
    if (input.giftSuggestions !== undefined) event.giftSuggestions = input.giftSuggestions;
    if (input.hostName !== undefined) event.hostName = input.hostName;
    return event;
  },
  async update(eventId, _actorUserId, input: UpdateEventInput) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    Object.assign(event, input);
    return event;
  },
  async activateCapsule(eventId, _actorUserId, tier: Exclude<PlanTier, "free">) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.plan = PLANS[tier];
    event.capsuleActivatedAt = new Date().toISOString();
    event.screen.enabled = true;
    return event;
  },
  async setCoverImage(eventId, _actorUserId, input) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.coverImageUrl = input.coverImageUrl;
    event.coverSource = input.coverSource;
    event.aiCoverPendingUrls = [];
    return event;
  },
  async incrementAiCoverUsage(eventId, _actorUserId, type) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (type === "generation") event.aiCoverGenerationsCount += 1;
    else event.aiCoverEditsCount += 1;
    return event;
  },
  async tryReserveAiCoverUsage(eventId, _actorUserId, type, maxAllowed) {
    const event = events.find((item) => item.id === eventId);
    if (!event) return false;
    if (type === "generation") {
      if (event.aiCoverGenerationsCount >= maxAllowed) return false;
      event.aiCoverGenerationsCount += 1;
      return true;
    }
    if (event.aiCoverEditsCount >= maxAllowed) return false;
    event.aiCoverEditsCount += 1;
    return true;
  },
  async refundAiCoverUsage(eventId, _actorUserId, type) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (type === "generation") event.aiCoverGenerationsCount = Math.max(0, event.aiCoverGenerationsCount - 1);
    else event.aiCoverEditsCount = Math.max(0, event.aiCoverEditsCount - 1);
    return event;
  },
  async purchaseAiCoverPack(eventId, _actorUserId) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.aiCoverPackBonusGenerations += 2;
    event.aiCoverPackBonusEdits += 2;
    return event;
  },
  async setAiCoverPendingUrls(eventId, urls) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.aiCoverPendingUrls = urls;
    return event;
  },
  async selectAiCoverVersion(eventId, _actorUserId, coverImageUrl) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.coverImageUrl = coverImageUrl;
    event.coverSource = "ai";
    event.aiCoverPendingUrls = [];
    return event;
  },
  async setInviteCopy(eventId, _actorUserId, inviteCopy) {
    await this.writeInviteCopy(eventId, inviteCopy);
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    return event;
  },
  async writeInviteCopy(eventId, inviteCopy) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.inviteCopy = inviteCopy;
  },
  async setHostPhoto(eventId, _actorUserId, hostPhotoUrl) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.hostPhotoUrl = hostPhotoUrl;
    return event;
  },
  async incrementAiTextUsage(eventId, _actorUserId, type) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (type === "generation") event.aiTextGenerationsCount += 1;
    else event.aiTextEditsCount += 1;
    return event;
  },
  async setVisibility(eventId, visibility) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.visibility = visibility;
    return event;
  },
  async updatePixSettings(eventId, _actorUserId, input) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.pix = input;
    return event;
  },
  async updateScreenSettings(eventId, _actorUserId, input) {
    const event = events.find((item) => item.id === eventId);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    event.screen = input;
    return event;
  }
};

export const inMemoryMembers: MemberRepository = {
  async findMembership(eventId, userId) {
    return members.find((member) => member.eventId === eventId && member.userId === userId) ?? null;
  },
  async listByEvent(eventId) {
    return members.filter((member) => member.eventId === eventId);
  },
  async confirmRsvp(eventId, userId) {
    const member = members.find((item) => item.eventId === eventId && item.userId === userId);
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    member.rsvpStatus = "confirmed";
    return member;
  },
  async ensureGuestMembership(eventId, userId) {
    let member = members.find((item) => item.eventId === eventId && item.userId === userId);
    if (!member) {
      member = {
        id: createId("mem"),
        eventId,
        userId,
        role: "guest",
        rsvpStatus: "confirmed",
        accessStatus: "active",
        joinedAt: new Date().toISOString()
      };
      members.push(member);
    } else {
      member.rsvpStatus = "confirmed";
      member.accessStatus = "active";
    }
    return member;
  },
  async blockGuest(eventId, userId, actorUserId) {
    const member = members.find((item) => item.eventId === eventId && item.userId === userId);
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    member.accessStatus = "blocked";
    mediaItems.forEach((item) => {
      if (item.eventId === eventId && item.userId === userId && item.status === "published") {
        item.status = "archived";
        item.visibleOnScreen = false;
      }
    });
    await inMemoryAudit.record({
      actorUserId,
      eventId,
      action: "member.blocked",
      targetType: "event_member",
      targetId: member.id
    });
    return member;
  },
  async unblockGuest(eventId, userId, actorUserId) {
    const member = members.find((item) => item.eventId === eventId && item.userId === userId);
    if (!member) throw new Error("MEMBER_NOT_FOUND");
    member.accessStatus = "active";
    await inMemoryAudit.record({
      actorUserId,
      eventId,
      action: "member.unblocked",
      targetType: "event_member",
      targetId: member.id
    });
    return member;
  }
};

export const inMemoryMedia: MediaRepository = {
  async listPublishedByEvent(eventId) {
    return mediaItems
      .filter((item) => item.eventId === eventId && item.status === "published")
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  },
  async countPublishedByEventIds(eventIds: string[]) {
    const idSet = new Set(eventIds);
    const counts: Record<string, number> = {};
    for (const item of mediaItems) {
      if (item.status !== "published" || !idSet.has(item.eventId)) continue;
      counts[item.eventId] = (counts[item.eventId] ?? 0) + 1;
    }
    return counts;
  },
  async findById(mediaId) {
    return mediaItems.find((item) => item.id === mediaId) ?? null;
  },
  async create(input: CreateMediaInput) {
    const user = users.find((item) => item.id === input.userId);
    const item: MediaItem = {
      id: createId("med"),
      eventId: input.eventId,
      userId: input.userId,
      guestRsvpId: input.guestRsvpId,
      authorName: input.authorDisplayName ?? user?.name ?? "Convidado",
      caption: input.caption,
      type: input.type,
      status: "published",
      visibleOnScreen: true,
      r2Key: input.r2Key,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      text: input.text,
      byteSize: input.byteSize,
      likesCount: 0,
      createdAt: new Date().toISOString()
    };
    mediaItems.unshift(item);
    const event = events.find((row) => row.id === input.eventId);
    if (event && input.byteSize) {
      event.storageUsedBytes += input.byteSize;
      event.storageUsedGb = event.storageUsedBytes / 1024 / 1024 / 1024;
      const ownerId = members.find((member) => member.eventId === input.eventId && member.role === "owner")?.userId;
      if (ownerId) {
        void inMemorySubscriptions.syncSharedStorageUsed(ownerId);
      }
    }
    return item;
  },
  async archive(mediaId, actorUserId) {
    const item = mediaItems.find((media) => media.id === mediaId);
    if (!item) throw new Error("MEDIA_NOT_FOUND");
    item.status = "archived";
    item.visibleOnScreen = false;
    await inMemoryAudit.record({
      actorUserId,
      eventId: item.eventId,
      action: "media.archived",
      targetType: "media_item",
      targetId: item.id
    });
    return item;
  },
  async archiveByUser(eventId, userId, actorUserId) {
    let count = 0;
    mediaItems.forEach((item) => {
      if (item.eventId === eventId && item.userId === userId && item.status === "published") {
        item.status = "archived";
        item.visibleOnScreen = false;
        count += 1;
      }
    });
    await inMemoryAudit.record({
      actorUserId,
      eventId,
      action: "media.archived_by_user",
      targetType: "user",
      targetId: userId,
      metadata: { count }
    });
    return count;
  },
  async delete(mediaId, actorUserId) {
    const item = mediaItems.find((media) => media.id === mediaId);
    if (!item) throw new Error("MEDIA_NOT_FOUND");
    const event = events.find((row) => row.id === item.eventId);
    if (event && item.status !== "deleted" && item.byteSize) {
      event.storageUsedBytes = Math.max(0, event.storageUsedBytes - item.byteSize);
      event.storageUsedGb = event.storageUsedBytes / 1024 / 1024 / 1024;
      const ownerId = members.find((member) => member.eventId === item.eventId && member.role === "owner")?.userId;
      if (ownerId) {
        void inMemorySubscriptions.syncSharedStorageUsed(ownerId);
      }
    }
    item.status = "deleted";
    item.visibleOnScreen = false;
    await inMemoryAudit.record({
      actorUserId,
      eventId: item.eventId,
      action: "media.deleted",
      targetType: "media_item",
      targetId: item.id
    });
  },
  async setScreenVisibility(mediaId, visible, actorUserId) {
    const item = mediaItems.find((media) => media.id === mediaId);
    if (!item) throw new Error("MEDIA_NOT_FOUND");
    item.visibleOnScreen = visible;
    await inMemoryAudit.record({
      actorUserId,
      eventId: item.eventId,
      action: "media.screen_visibility_changed",
      targetType: "media_item",
      targetId: item.id,
      metadata: { visible }
    });
    return item;
  }
};

const likedMedia = new Set<string>();
const guestLikedMedia = new Set<string>();

export const inMemoryLikes: LikeRepository = {
  async toggleGuestLike(eventId, mediaId, guestRsvpId) {
    const item = mediaItems.find((media) => media.eventId === eventId && media.id === mediaId);
    if (!item) throw new Error("MEDIA_NOT_FOUND");
    const key = `guest:${eventId}:${mediaId}:${guestRsvpId}`;
    const liked = !guestLikedMedia.has(key);
    if (liked) {
      guestLikedMedia.add(key);
      item.likesCount += 1;
    } else {
      guestLikedMedia.delete(key);
      item.likesCount = Math.max(0, item.likesCount - 1);
    }
    return { liked, likesCount: item.likesCount };
  },
  async toggleLike(eventId, mediaId, userId) {
    const item = mediaItems.find((media) => media.eventId === eventId && media.id === mediaId);
    if (!item) throw new Error("MEDIA_NOT_FOUND");

    const key = `${eventId}:${mediaId}:${userId}`;
    const liked = !likedMedia.has(key);
    if (liked) {
      likedMedia.add(key);
      item.likesCount += 1;
    } else {
      likedMedia.delete(key);
      item.likesCount = Math.max(0, item.likesCount - 1);
    }

    return { liked, likesCount: item.likesCount };
  }
};

const auditLogStore = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __praesentiaAuditLogStore?: {
      id: string;
      actorUserId: string | null;
      eventId: string | null;
      action: string;
      targetType: string;
      targetId: string | null;
      metadata: Record<string, unknown>;
      createdAt: string;
    }[];
  };
  if (!globalStore.__praesentiaAuditLogStore) {
    globalStore.__praesentiaAuditLogStore = [];
  }
  return globalStore.__praesentiaAuditLogStore;
})();

export const inMemoryAudit: AuditRepository = {
  async record(input) {
    auditLogStore.unshift({
      id: createId("audit"),
      actorUserId: input.actorUserId,
      eventId: input.eventId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
      createdAt: new Date().toISOString()
    });
    console.info("[audit:mock]", input.action, input.eventId, input.targetType, input.targetId);
  },
  async listBillingByActorUserId(userId, limit = 50) {
    return auditLogStore
      .filter((row) => row.actorUserId === userId && BILLING_AUDIT_ACTIONS.includes(row.action as (typeof BILLING_AUDIT_ACTIONS)[number]))
      .slice(0, limit);
  }
};

const guestRsvpStore: GuestRsvp[] = [];

export const inMemoryGuestRsvps: GuestRsvpRepository = {
  async create(input: CreateGuestRsvpInput): Promise<GuestRsvp> {
    const companions = (input.companionNames ?? []).map((name) => name.trim()).filter(Boolean);
    const companionsDetail = input.companionsDetail ?? [];
    const detailNames = companionsDetail.map((item) => item.name.trim()).filter(Boolean);
    const mergedNames = detailNames.length ? detailNames : companions;
    const rsvp: GuestRsvp = {
      id: createId("rsvp"),
      eventId: input.eventId,
      guestName: input.guestName,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      phone: input.phone,
      companionName: mergedNames[0] ?? input.companionName,
      companionNames: mergedNames.length ? mergedNames : input.companionName ? [input.companionName] : [],
      companionsDetail: companionsDetail.length ? companionsDetail : undefined,
      rsvpStatus: input.rsvpStatus ?? "confirmed",
      pixContributedAmount: input.pixContributedAmount,
      termsAcceptedAt: input.termsAcceptedAt,
      wantsCapsule: input.wantsCapsule,
      confirmedAt: new Date().toISOString()
    };
    guestRsvpStore.push(rsvp);
    return rsvp;
  },
  async sumPixContributions(eventId: string): Promise<number> {
    return guestRsvpStore
      .filter((item) => item.eventId === eventId && item.rsvpStatus === "confirmed")
      .reduce((sum, item) => sum + (item.pixContributedAmount ?? 0), 0);
  },
  async findConfirmedByEmail(eventId, email) {
    const normalized = email.trim().toLowerCase();
    return (
      guestRsvpStore.find(
        (item) =>
          item.eventId === eventId &&
          item.rsvpStatus === "confirmed" &&
          item.guestEmail?.trim().toLowerCase() === normalized
      ) ?? null
    );
  },
  async listByEvent(eventId: string): Promise<GuestRsvp[]> {
    return guestRsvpStore.filter((r) => r.eventId === eventId);
  },
  async listByEventIds(eventIds: string[]): Promise<GuestRsvp[]> {
    const idSet = new Set(eventIds);
    return guestRsvpStore.filter((r) => idSet.has(r.eventId));
  },
  async findById(eventId, rsvpId) {
    return guestRsvpStore.find((item) => item.id === rsvpId && item.eventId === eventId) ?? null;
  },
  async updateCompanions(eventId, rsvpId, companionNames) {
    const rsvp = guestRsvpStore.find((item) => item.id === rsvpId && item.eventId === eventId);
    if (!rsvp) throw new Error("RSVP_NOT_FOUND");
    if (rsvp.checkedInAt) throw new Error("ALREADY_CHECKED_IN");
    const names = companionNames.map((name) => name.trim()).filter(Boolean);
    rsvp.companionNames = names;
    rsvp.companionName = names[0];
    return rsvp;
  },
  async checkIn(eventId, rsvpId, _actorUserId) {
    const rsvp = guestRsvpStore.find((item) => item.id === rsvpId && item.eventId === eventId);
    if (!rsvp) throw new Error("RSVP_NOT_FOUND");
    rsvp.checkedInAt = new Date().toISOString();
    return rsvp;
  },
  async undoCheckIn(eventId, rsvpId, _actorUserId) {
    const rsvp = guestRsvpStore.find((item) => item.id === rsvpId && item.eventId === eventId);
    if (!rsvp) throw new Error("RSVP_NOT_FOUND");
    rsvp.checkedInAt = undefined;
    return rsvp;
  }
};

const subscriptionStore: UserSubscription[] = [];

export const inMemorySubscriptions: SubscriptionRepository = {
  async findActiveByUser(userId) {
    const now = Date.now();
    return (
      subscriptionStore.find(
        (item) =>
          item.userId === userId &&
          item.status === "active" &&
          Date.parse(item.currentPeriodStart) <= now &&
          Date.parse(item.currentPeriodEnd) >= now
      ) ?? null
    );
  },
  async activateFamilyPlan(userId) {
    const existing = await this.findActiveByUser(userId);
    if (existing) return existing;

    const now = new Date();
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);

    const subscription: UserSubscription = {
      id: createId("sub"),
      userId,
      planTier: "family",
      status: "active",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: end.toISOString(),
      eventsUsedThisPeriod: 0,
      sharedStorageUsedGb: 0,
      extraStorageGb: 0
    };
    subscriptionStore.push(subscription);
    return subscription;
  },
  async consumeEventSlot(userId) {
    const subscription = await this.findActiveByUser(userId);
    if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");
    subscription.eventsUsedThisPeriod += 1;
    return subscription;
  },
  async addExtraStorage(userId, gb) {
    const subscription = await this.findActiveByUser(userId);
    if (!subscription) throw new Error("SUBSCRIPTION_NOT_FOUND");
    subscription.extraStorageGb += gb;
    return subscription;
  },
  async syncSharedStorageUsed(ownerId) {
    const subscription = await this.findActiveByUser(ownerId);
    if (!subscription) return;
    subscription.sharedStorageUsedGb = (await inMemoryEvents.sumFamilyStorageUsedBytes(ownerId)) / 1024 / 1024 / 1024;
  }
};

type InMemoryAiCoverArtifact = {
  id: string;
  eventId: string;
  userId: string;
  usageType: "generation" | "edit";
  promptVersion: string;
  requestSummary: Record<string, unknown>;
  status: "reserved" | "completed" | "refunded";
  imageDataUrl?: string;
  artifact?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
};

const aiCoverArtifacts = new Map<string, InMemoryAiCoverArtifact>();

function toArtifactRecord(artifact: InMemoryAiCoverArtifact) {
  return {
    id: artifact.id,
    eventId: artifact.eventId,
    userId: artifact.userId,
    usageType: artifact.usageType,
    status: artifact.status,
    imageDataUrl: artifact.imageDataUrl,
    createdAt: artifact.createdAt,
    completedAt: artifact.completedAt
  };
}

const inMemoryAiCoverArtifacts: AiCoverArtifactRepository = {
  async createReserved(input) {
    const id = createId("cover_art");
    aiCoverArtifacts.set(id, {
      id,
      eventId: input.eventId,
      userId: input.userId,
      usageType: input.usageType,
      promptVersion: input.promptVersion,
      requestSummary: input.requestSummary,
      status: "reserved",
      createdAt: new Date().toISOString()
    });
    return id;
  },
  async findById(artifactId) {
    const artifact = aiCoverArtifacts.get(artifactId);
    return artifact ? toArtifactRecord(artifact) : null;
  },
  async findLatestReservedByEvent(eventId) {
    const reserved = [...aiCoverArtifacts.values()]
      .filter((item) => item.eventId === eventId && item.status === "reserved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return reserved[0] ? toArtifactRecord(reserved[0]) : null;
  },
  async complete(artifactId, input) {
    const artifact = aiCoverArtifacts.get(artifactId);
    if (!artifact) throw new Error("ARTIFACT_NOT_FOUND");
    artifact.status = "completed";
    artifact.imageDataUrl = input.imageDataUrl;
    artifact.completedAt = new Date().toISOString();
    artifact.artifact = {
      prompt: input.prompt,
      model: input.model,
      size: input.size,
      quality: input.quality,
      ...input.artifact
    };
  },
  async delete(artifactId) {
    aiCoverArtifacts.delete(artifactId);
  }
};

const guestMessageStore: GuestMessage[] = [];

const muralCodeStore: Array<{
  eventId: string;
  guestRsvpId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
}> = [];
const muralRequestStore: MuralAccessRequest[] = [];

const inMemoryMuralAccess: MuralAccessRepository = {
  async createCode(input) {
    muralCodeStore.push({
      eventId: input.eventId,
      guestRsvpId: input.guestRsvpId,
      email: input.email.toLowerCase(),
      codeHash: input.codeHash,
      expiresAt: input.expiresAt
    });
  },
  async findLatestCode(eventId, email) {
    const row = [...muralCodeStore]
      .reverse()
      .find((item) => item.eventId === eventId && item.email === email.toLowerCase());
    return row
      ? { codeHash: row.codeHash, expiresAt: row.expiresAt, guestRsvpId: row.guestRsvpId }
      : null;
  },
  async createAccessRequest(input) {
    const request: MuralAccessRequest = {
      id: createId("mreq"),
      eventId: input.eventId,
      guestFirstName: input.guestFirstName,
      guestLastName: input.guestLastName,
      guestEmail: input.guestEmail,
      phone: input.phone,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    muralRequestStore.push(request);
    return request;
  },
  async listAccessRequests(eventId) {
    return muralRequestStore.filter((item) => item.eventId === eventId);
  },
  async updateAccessRequestStatus(eventId, requestId, status) {
    const request = muralRequestStore.find((item) => item.id === requestId && item.eventId === eventId);
    if (!request) throw new Error("REQUEST_NOT_FOUND");
    request.status = status;
    return request;
  }
};

const inMemoryGuestMessages: GuestMessageRepository = {
  async create(input) {
    const message: GuestMessage = {
      id: createId("gmsg"),
      eventId: input.eventId,
      authorName: input.authorName,
      body: input.body,
      visibility: input.visibility,
      createdAt: new Date().toISOString()
    };
    guestMessageStore.push(message);
    return message;
  },
  async listPublicByEvent(eventId) {
    return guestMessageStore.filter((item) => item.eventId === eventId && item.visibility === "public");
  },
  async listPrivateByEvent(eventId) {
    return guestMessageStore.filter((item) => item.eventId === eventId && item.visibility === "private");
  }
};

const photoAlbumOrderStore: PhotoAlbumOrder[] = [];

const inMemoryPhotoAlbumOrders: PhotoAlbumOrderRepository = {
  async findByEventId(eventId) {
    return photoAlbumOrderStore.find((order) => order.eventId === eventId) ?? null;
  },
  async upsertDraft(input) {
    const existing = photoAlbumOrderStore.find((order) => order.eventId === input.eventId);
    if (existing && (existing.status === "paid" || existing.status === "in_production" || existing.status === "shipped")) {
      throw new Error("Este álbum já foi pago e não pode ser alterado.");
    }
    const now = new Date().toISOString();
    if (existing) {
      existing.draft = input.draft;
      existing.pageCount = input.pageCount;
      existing.totalCents = input.totalCents;
      existing.updatedAt = now;
      return existing;
    }
    const order: PhotoAlbumOrder = {
      id: createId("album"),
      eventId: input.eventId,
      userId: input.userId,
      draft: input.draft as PhotoAlbumDraft,
      status: "draft",
      pageCount: input.pageCount,
      totalCents: input.totalCents,
      createdAt: now,
      updatedAt: now
    };
    photoAlbumOrderStore.push(order);
    return order;
  },
  async markSubmitted(orderId, input) {
    const order = photoAlbumOrderStore.find((item) => item.id === orderId);
    if (!order || (order.status !== "draft" && order.status !== "submitted")) {
      throw new Error("Pedido de álbum não encontrado ou já pago.");
    }
    order.status = "submitted";
    order.pageCount = input.pageCount;
    order.totalCents = input.totalCents;
    order.submittedAt = order.submittedAt ?? new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    return order;
  },
  async markPaid(orderId, stripeSessionId) {
    const order = photoAlbumOrderStore.find((item) => item.id === orderId);
    if (!order) throw new Error("Pedido de álbum não encontrado.");
    order.status = "paid";
    order.paidAt = new Date().toISOString();
    if (stripeSessionId) order.stripeSessionId = stripeSessionId;
    order.updatedAt = new Date().toISOString();
    return order;
  }
};

export const repositories = {
  users: inMemoryUsers,
  events: inMemoryEvents,
  members: inMemoryMembers,
  media: inMemoryMedia,
  likes: inMemoryLikes,
  audit: inMemoryAudit,
  aiCoverArtifacts: inMemoryAiCoverArtifacts,
  guestRsvps: inMemoryGuestRsvps,
  guestMessages: inMemoryGuestMessages,
  muralAccess: inMemoryMuralAccess,
  subscriptions: inMemorySubscriptions,
  photoAlbumOrders: inMemoryPhotoAlbumOrders
};
