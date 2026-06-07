export type EventVisibility = "private" | "public";
export type EventPhase = "before" | "live" | "memory";
export type MemberRole = "owner" | "manager" | "guest" | "viewer";
export type RSVPStatus = "pending" | "confirmed" | "declined";
export type AccessStatus = "active" | "blocked";
export type MediaType = "photo" | "video" | "message";
export type MediaStatus = "published" | "archived" | "deleted";
export type PlanTier = "free" | "capsule" | "family";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "platform_admin" | "user";
};

export type EventPlan = {
  tier: PlanTier;
  label: string;
  storageGb: number;
  retentionMonths: 36;
  yearlyEventLimit?: number;
  customSubdomain: boolean;
};

export type Event = {
  id: string;
  slug: string;
  freeCode?: string;
  subdomain?: string;
  title: string;
  theme: string;
  hostName: string;
  date: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
  visibility: EventVisibility;
  phase: EventPhase;
  plan: EventPlan;
  storageUsedGb: number;
  pix?: PixSettings;
  screen: ScreenSettings;
};

export type EventMember = {
  id: string;
  eventId: string;
  userId: string;
  role: MemberRole;
  rsvpStatus: RSVPStatus;
  accessStatus: AccessStatus;
  joinedAt: string;
};

export type PixSettings = {
  enabled: boolean;
  receiverName: string;
  key: string;
  suggestedAmount?: number;
  message?: string;
};

export type ScreenSettings = {
  enabled: boolean;
  token: string;
  paused: boolean;
  showQrCode: boolean;
  showVideos: boolean;
  showMessages: boolean;
  layout: "recent_plus_top3";
};

export type MediaItem = {
  id: string;
  eventId: string;
  userId: string;
  authorName: string;
  type: MediaType;
  status: MediaStatus;
  visibleOnScreen: boolean;
  r2Key?: string;
  url?: string;
  thumbnailUrl?: string;
  text?: string;
  byteSize?: number;
  likesCount: number;
  createdAt: string;
};

export type AuditAction =
  | "event.visibility_changed"
  | "event.pix_changed"
  | "member.blocked"
  | "member.unblocked"
  | "media.archived"
  | "media.deleted"
  | "screen.token_rotated";
