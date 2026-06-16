import type { Event, EventMember, MediaItem, User } from "@/types/domain";
import { PLANS } from "@/lib/plans";

const SEED_USERS: User[] = [
  { id: "usr_owner", name: "Camila Andrade", email: "camila@example.com", role: "user", aiInviteFreeUsed: false, aiInvitePoolRemaining: 0 },
  { id: "usr_maria", name: "Maria Silva", email: "maria@example.com", role: "user", aiInviteFreeUsed: false, aiInvitePoolRemaining: 0 },
  { id: "usr_admin", name: "Super Admin Praesentia", email: "adm.praesentia@gmail.com", role: "platform_admin", aiInviteFreeUsed: false, aiInvitePoolRemaining: 0 }
];

const SEED_EVENTS: Event[] = [
  {
    id: "evt_mavie",
    slug: "mavie-1-ano",
    freeCode: "k8d2m9",
    subdomain: "mavie1ano",
    title: "Mavie Fontinhas - 1 ano",
    theme: "Jardim Encantado",
    eventType: "festa_infantil",
    hostName: "Camila Andrade",
    eventFormat: "in_person",
    aiCoverGenerationsCount: 0,
    aiCoverEditsCount: 0,
    aiCoverPackBonusGenerations: 0,
    aiCoverPackBonusEdits: 0,
    aiTextGenerationsCount: 0,
    aiTextEditsCount: 0,
    aiCoverPendingUrls: [],
    capsuleActivatedAt: "2026-02-01T12:00:00.000Z",
    date: "2026-03-14",
    startsAt: "15:00",
    endsAt: "19:00",
    venueName: "Quintal das Acacias",
    venueAddress: "R. das Hortensias, 88 - Jardim Botanico",
    city: "Sao Paulo",
    rsvpEnabled: true,
    giftSuggestions: [],
    visibility: "private",
    phase: "live",
    plan: PLANS.capsule,
    storageUsedBytes: Math.round(1.8 * 1024 * 1024 * 1024),
    storageUsedGb: 1.8,
    extraStorageGb: 0,
    pix: {
      enabled: true,
      receiverName: "Camila Andrade",
      key: "camila.pix@example.com",
      suggestedAmount: 50,
      message: "Contribuição opcional para a festa da Mavie Fontinhas."
    },
    screen: {
      enabled: true,
      token: "screen_demo_token",
      paused: false,
      showQrCode: true,
      showVideos: true,
      showMessages: true,
      layout: "recent_plus_top3"
    }
  }
];

const SEED_MEMBERS: EventMember[] = [
  {
    id: "mem_owner",
    eventId: "evt_mavie",
    userId: "usr_owner",
    role: "owner",
    rsvpStatus: "confirmed",
    accessStatus: "active",
    joinedAt: "2026-02-10T13:00:00.000Z"
  },
  {
    id: "mem_maria",
    eventId: "evt_mavie",
    userId: "usr_maria",
    role: "guest",
    rsvpStatus: "confirmed",
    accessStatus: "active",
    joinedAt: "2026-02-18T18:30:00.000Z"
  }
];

const SEED_MEDIA: MediaItem[] = [
  {
    id: "med_001",
    eventId: "evt_mavie",
    userId: "usr_maria",
    authorName: "Maria Silva",
    type: "photo",
    status: "published",
    visibleOnScreen: true,
    thumbnailUrl: "/placeholder-photo.svg",
    url: "/placeholder-photo.svg",
    likesCount: 42,
    createdAt: "2026-03-14T18:10:00.000Z"
  },
  {
    id: "med_002",
    eventId: "evt_mavie",
    userId: "usr_owner",
    authorName: "Camila Andrade",
    type: "message",
    status: "published",
    visibleOnScreen: true,
    text: "Obrigada por fazerem parte desse primeiro giro em volta do sol.",
    likesCount: 31,
    createdAt: "2026-03-14T18:08:00.000Z"
  },
  {
    id: "med_003",
    eventId: "evt_mavie",
    userId: "usr_maria",
    authorName: "Maria Silva",
    type: "video",
    status: "published",
    visibleOnScreen: true,
    thumbnailUrl: "/placeholder-video.svg",
    url: "/placeholder-video.svg",
    likesCount: 25,
    createdAt: "2026-03-14T18:03:00.000Z"
  }
];

type DevMockStore = {
  users: User[];
  events: Event[];
  members: EventMember[];
  mediaItems: MediaItem[];
};

function cloneSeed<T>(value: T): T {
  return structuredClone(value);
}

function getDevMockStore(): DevMockStore {
  const globalStore = globalThis as typeof globalThis & { __praesentiaDevMockStore?: DevMockStore };
  if (!globalStore.__praesentiaDevMockStore) {
    globalStore.__praesentiaDevMockStore = {
      users: cloneSeed(SEED_USERS),
      events: cloneSeed(SEED_EVENTS),
      members: cloneSeed(SEED_MEMBERS),
      mediaItems: cloneSeed(SEED_MEDIA)
    };
  }
  return globalStore.__praesentiaDevMockStore;
}

const store = getDevMockStore();

export const users = store.users;
export const events = store.events;
export const members = store.members;
export const mediaItems = store.mediaItems;

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug || event.freeCode === slug);
}

export function getEventMedia(eventId: string) {
  return mediaItems
    .filter((item) => item.eventId === eventId && item.status === "published")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
