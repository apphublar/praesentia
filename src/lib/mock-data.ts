import type { Event, EventMember, MediaItem, User } from "@/types/domain";
import { PLANS } from "@/lib/plans";

export const users: User[] = [
  { id: "usr_owner", name: "Camila Andrade", email: "camila@example.com", role: "user" },
  { id: "usr_maria", name: "Maria Silva", email: "maria@example.com", role: "user" },
  { id: "usr_admin", name: "Equipe Praesentia", email: "admin@praesentia.com.br", role: "platform_admin" }
];

export const events: Event[] = [
  {
    id: "evt_mavie",
    slug: "mavie-1-ano",
    freeCode: "k8d2m9",
    subdomain: "mavie1ano",
    title: "Mavie - 1 ano",
    theme: "Jardim Encantado",
    eventType: "festa_infantil",
    hostName: "Camila Andrade",
    date: "2026-03-14",
    startsAt: "15:00",
    endsAt: "19:00",
    venueName: "Quintal das Acacias",
    venueAddress: "R. das Hortensias, 88 - Jardim Botanico",
    city: "Sao Paulo",
    visibility: "private",
    phase: "live",
    plan: PLANS.capsule,
    storageUsedGb: 1.8,
    pix: {
      enabled: true,
      receiverName: "Camila Andrade",
      key: "camila.pix@example.com",
      suggestedAmount: 50,
      message: "Contribuicao opcional para a festa da Mavie."
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

export const members: EventMember[] = [
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

export const mediaItems: MediaItem[] = [
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

export function getEventBySlug(slug: string) {
  return events.find((event) => event.slug === slug || event.freeCode === slug);
}

export function getEventMedia(eventId: string) {
  return mediaItems
    .filter((item) => item.eventId === eventId && item.status === "published")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
