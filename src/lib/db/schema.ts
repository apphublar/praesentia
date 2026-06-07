import type {
  AccessStatus,
  EventPhase,
  EventVisibility,
  MediaStatus,
  MediaType,
  MemberRole,
  PlanTier,
  RSVPStatus
} from "@/types/domain";

export type DbUser = {
  id: string;
  name: string;
  email: string;
  role: "platform_admin" | "user";
  createdAt: Date;
  updatedAt: Date;
};

export type DbEvent = {
  id: string;
  ownerId: string;
  slug: string;
  freeCode: string | null;
  subdomain: string | null;
  title: string;
  theme: string;
  description: string | null;
  date: Date;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
  visibility: EventVisibility;
  phase: EventPhase;
  planTier: PlanTier;
  storageLimitBytes: bigint;
  storageUsedBytes: bigint;
  retentionUntil: Date;
  publicTermsAcceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbEventMember = {
  id: string;
  eventId: string;
  userId: string;
  role: MemberRole;
  rsvpStatus: RSVPStatus;
  accessStatus: AccessStatus;
  blockedAt: Date | null;
  blockedByUserId: string | null;
  joinedAt: Date;
  updatedAt: Date;
};

export type DbPixSettings = {
  eventId: string;
  enabled: boolean;
  receiverName: string;
  keyEncrypted: string;
  suggestedAmountCents: number | null;
  message: string | null;
  updatedAt: Date;
};

export type DbMediaItem = {
  id: string;
  eventId: string;
  userId: string;
  type: MediaType;
  status: MediaStatus;
  visibleOnScreen: boolean;
  r2Key: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  text: string | null;
  byteSize: number;
  likesCount: number;
  archivedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbLike = {
  eventId: string;
  mediaId: string;
  userId: string;
  createdAt: Date;
};

export type DbScreenSettings = {
  eventId: string;
  tokenHash: string;
  enabled: boolean;
  paused: boolean;
  showQrCode: boolean;
  showVideos: boolean;
  showMessages: boolean;
  layout: "recent_plus_top3";
  updatedAt: Date;
};

export type DbAuditLog = {
  id: string;
  actorUserId: string | null;
  eventId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
};
