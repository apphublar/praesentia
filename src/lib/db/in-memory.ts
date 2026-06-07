import { events, mediaItems, members, users } from "@/lib/mock-data";
import { randomUUID } from "node:crypto";
import type {
  AuditRepository,
  CreateEventInput,
  CreateGuestRsvpInput,
  CreateMediaInput,
  EventRepository,
  GuestRsvpRepository,
  LikeRepository,
  MediaRepository,
  MemberRepository,
  UserRepository
} from "@/lib/db/repositories";
import { PLANS } from "@/lib/plans";
import type { Event, GuestRsvp, MediaItem } from "@/types/domain";

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export const inMemoryUsers: UserRepository = {
  async findById(id) {
    return users.find((user) => user.id === id) ?? null;
  },
  async findByEmail(email) {
    return users.find((user) => user.email === email) ?? null;
  }
};

export const inMemoryEvents: EventRepository = {
  async findById(id) {
    return events.find((event) => event.id === id) ?? null;
  },
  async findBySlugOrCode(slugOrCode) {
    return events.find((event) => event.slug === slugOrCode || event.freeCode === slugOrCode) ?? null;
  },
  async listByOwner(userId) {
    const manageableEventIds = new Set(
      members
        .filter((member) => member.userId === userId && (member.role === "owner" || member.role === "manager"))
        .map((member) => member.eventId)
    );
    return events.filter((event) => manageableEventIds.has(event.id));
  },
  async create(input: CreateEventInput) {
    const eventId = createId("evt");
    const event: Event = {
      id: eventId,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      freeCode: Math.random().toString(36).slice(2, 8),
      title: input.title,
      theme: input.theme,
      eventType: input.eventType,
      hostName: input.hostName || users.find((user) => user.id === input.ownerId)?.name || "Responsavel",
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      city: input.city,
      visibility: "private",
      phase: "before",
      plan: PLANS.free,
      storageUsedGb: 0,
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
  async create(input: CreateMediaInput) {
    const user = users.find((item) => item.id === input.userId);
    const item: MediaItem = {
      id: createId("med"),
      eventId: input.eventId,
      userId: input.userId,
      authorName: user?.name ?? "Convidado",
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
      event.storageUsedGb += input.byteSize / 1024 / 1024 / 1024;
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
      event.storageUsedGb = Math.max(0, event.storageUsedGb - item.byteSize / 1024 / 1024 / 1024);
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

export const inMemoryLikes: LikeRepository = {
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

export const inMemoryAudit: AuditRepository = {
  async record(input) {
    console.info("[audit:mock]", input.action, input.eventId, input.targetType, input.targetId);
  }
};

const guestRsvpStore: GuestRsvp[] = [];

export const inMemoryGuestRsvps: GuestRsvpRepository = {
  async create(input: CreateGuestRsvpInput): Promise<GuestRsvp> {
    const rsvp: GuestRsvp = {
      id: createId("rsvp"),
      eventId: input.eventId,
      guestName: input.guestName,
      phone: input.phone,
      wantsCapsule: input.wantsCapsule,
      confirmedAt: new Date().toISOString()
    };
    guestRsvpStore.push(rsvp);
    return rsvp;
  },
  async listByEvent(eventId: string): Promise<GuestRsvp[]> {
    return guestRsvpStore.filter((r) => r.eventId === eventId);
  }
};

export const repositories = {
  users: inMemoryUsers,
  events: inMemoryEvents,
  members: inMemoryMembers,
  media: inMemoryMedia,
  likes: inMemoryLikes,
  audit: inMemoryAudit,
  guestRsvps: inMemoryGuestRsvps
};
