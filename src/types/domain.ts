export type EventVisibility = "private" | "public";
export type EventPhase = "before" | "live" | "memory";
export type EventType =
  | "aniversario"
  | "cha_fraldas"
  | "cha_revelacao"
  | "batizado"
  | "festa_15_anos"
  | "formatura"
  | "festa_infantil"
  | "cha_casa_nova"
  | "cha_pet"
  | "natal"
  | "vaquinha"
  | "casamento"
  | "corporativo"
  | "eventos_diversos"
  | "outros";
export type MemberRole = "owner" | "manager" | "guest" | "viewer";
export type RSVPStatus = "pending" | "confirmed" | "declined";
export type AccessStatus = "active" | "blocked";
export type MediaType = "photo" | "video" | "message";
export type MediaStatus = "published" | "archived" | "deleted";
export type PlanTier = "free" | "capsule" | "family";
export type EventFormat = "in_person" | "online" | "fundraising";
export type CoverSource = "ai" | "custom";

export type InviteCopy = {
  headline: string;
  message: string;
  whatsapp: string;
  hashtags: string[];
};

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
  eventType: EventType;
  hostName: string;
  hostPhotoUrl?: string;
  coverImageUrl?: string;
  coverSource?: CoverSource;
  aiCoverGenerationsCount: number;
  aiCoverEditsCount: number;
  aiCoverPendingUrls?: string[];
  aiTextGenerationsCount: number;
  aiTextEditsCount: number;
  inviteCopy?: InviteCopy;
  eventFormat: EventFormat;
  onlineMeetingUrl?: string;
  date: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  city: string;
  visibility: EventVisibility;
  phase: EventPhase;
  plan: EventPlan;
  capsuleActivatedAt?: string;
  storageUsedBytes: number;
  storageUsedGb: number;
  extraStorageGb: number;
  pix?: PixSettings;
  screen: ScreenSettings;
};

export type GuestRsvp = {
  id: string;
  eventId: string;
  guestName: string;
  phone?: string;
  companionName?: string;
  wantsCapsule: boolean;
  checkedInAt?: string;
  confirmedAt: string;
};

export type UserSubscription = {
  id: string;
  userId: string;
  planTier: "family";
  status: "active" | "canceled" | "past_due";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  eventsUsedThisPeriod: number;
  sharedStorageUsedGb: number;
  extraStorageGb: number;
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
