import type { Event, EventMember, MediaItem, User } from "@/types/domain";

export type CreateEventInput = {
  ownerId: string;
  title: string;
  theme: string;
  date: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
};

export type CreateMediaInput = {
  eventId: string;
  userId: string;
  type: MediaItem["type"];
  text?: string;
  r2Key?: string;
  url?: string;
  thumbnailUrl?: string;
  byteSize?: number;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlugOrCode(slugOrCode: string): Promise<Event | null>;
  listByOwner(userId: string): Promise<Event[]>;
  create(input: CreateEventInput): Promise<Event>;
  setVisibility(eventId: string, visibility: Event["visibility"], actorUserId: string): Promise<Event>;
  updatePixSettings(eventId: string, actorUserId: string, input: Event["pix"]): Promise<Event>;
  updateScreenSettings(eventId: string, actorUserId: string, input: Event["screen"]): Promise<Event>;
}

export interface MemberRepository {
  findMembership(eventId: string, userId: string): Promise<EventMember | null>;
  listByEvent(eventId: string): Promise<EventMember[]>;
  confirmRsvp(eventId: string, userId: string): Promise<EventMember>;
  blockGuest(eventId: string, userId: string, actorUserId: string): Promise<EventMember>;
  unblockGuest(eventId: string, userId: string, actorUserId: string): Promise<EventMember>;
}

export interface MediaRepository {
  listPublishedByEvent(eventId: string): Promise<MediaItem[]>;
  create(input: CreateMediaInput): Promise<MediaItem>;
  archive(mediaId: string, actorUserId: string): Promise<MediaItem>;
  archiveByUser(eventId: string, userId: string, actorUserId: string): Promise<number>;
  delete(mediaId: string, actorUserId: string): Promise<void>;
  setScreenVisibility(mediaId: string, visible: boolean, actorUserId: string): Promise<MediaItem>;
}

export interface LikeRepository {
  toggleLike(eventId: string, mediaId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
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
