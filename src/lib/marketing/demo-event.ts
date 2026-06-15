import type { Event } from "@/types/domain";
import { PLANS } from "@/lib/plans";
import { DEMO_EVENT_SLUG } from "@/lib/marketing/site-nav-links";

export { DEMO_EVENT_SLUG };

export function isDemoEventSlug(slug: string) {
  return slug === DEMO_EVENT_SLUG;
}

function rollingDemoDates(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() + 45);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return {
    date: `${y}-${m}-${d}`,
    startsAt: "15:00",
    endsAt: "19:00"
  };
}

export function getDemoEventFallback(now = new Date()): Event {
  const dates = rollingDemoDates(now);
  return {
    id: "evt_mavie_demo",
    slug: DEMO_EVENT_SLUG,
    freeCode: "k8d2m9",
    subdomain: "mavie1ano",
    title: "Mavie Fontinhas — 1 aninho",
    theme: "Jardim Encantado",
    eventType: "festa_infantil",
    hostName: "Camila Andrade",
    organizerName: "Camila Andrade",
    eventFormat: "in_person",
    aiCoverGenerationsCount: 0,
    aiCoverEditsCount: 0,
    aiCoverPackBonusGenerations: 0,
    aiCoverPackBonusEdits: 0,
    aiTextGenerationsCount: 0,
    aiTextEditsCount: 0,
    aiCoverPendingUrls: [],
    capsuleActivatedAt: now.toISOString(),
    ...dates,
    venueName: "Quintal das Acácias",
    venueAddress: "R. das Hortensias, 88 — Jardim Botânico",
    city: "São Paulo",
    rsvpEnabled: true,
    giftSuggestions: [],
    visibility: "private",
    phase: "before",
    plan: PLANS.capsule,
    storageUsedBytes: 0,
    storageUsedGb: 0,
    extraStorageGb: 0,
    inviteCopy: {
      headline: "Mavie Fontinhas faz 1 aninho!",
      message:
        "A nossa Mavie Fontinhas chegou no começo de 2025 e mudou tudo. Queremos celebrar com você esse primeiro giro em volta do sol. Use tons de jardim no look, se puder!",
      whatsapp: "Oi! Confirmo presença na festa da Mavie Fontinhas 🌸",
      hashtags: ["#Mavie1Ano", "#JardimEncantado"]
    },
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
  };
}

/** Garante convite demonstrativo sempre visível, com datas futuras e cápsula ativa. */
export function applyDemoEventPresentation(event: Event, now = new Date()): Event {
  const dates = rollingDemoDates(now);
  return {
    ...event,
    slug: DEMO_EVENT_SLUG,
    title: "Mavie Fontinhas — 1 aninho",
    theme: "Jardim Encantado",
    hostName: event.hostName || "Camila Andrade",
    organizerName: event.organizerName || event.hostName || "Camila Andrade",
    ...dates,
    phase: "before",
    rsvpEnabled: true,
    capsuleActivatedAt: event.capsuleActivatedAt ?? now.toISOString(),
    plan: event.plan?.tier === "free" ? PLANS.capsule : (event.plan ?? PLANS.capsule),
    coverImageUrl: undefined,
    venueName: event.venueName || "Quintal das Acácias",
    venueAddress: event.venueAddress || "R. das Hortensias, 88 — Jardim Botânico",
    city: event.city || "São Paulo",
    inviteCopy: event.inviteCopy ?? getDemoEventFallback(now).inviteCopy,
    pix: event.pix ?? getDemoEventFallback(now).pix
  };
}

export function resolveDemoEvent(event: Event | null, slug: string, now = new Date()): Event | null {
  if (!isDemoEventSlug(slug)) return event;
  if (!event) return applyDemoEventPresentation(getDemoEventFallback(now), now);
  return applyDemoEventPresentation(event, now);
}
