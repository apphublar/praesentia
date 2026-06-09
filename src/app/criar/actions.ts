"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";
import type { EventFormat, EventType } from "@/types/domain";

const EVENT_TYPES: EventType[] = ["festa_infantil", "casamento", "aniversario", "formatura", "corporativo", "outros"];

function required(value: FormDataEntryValue | null, maxLength: number) {
  return sanitizeText(value, maxLength);
}

export async function createEventAction(formData: FormData) {
  const session = await requireSession();

  const eventType = required(formData.get("eventType"), 30) as EventType;
  const eventFormat = required(formData.get("eventFormat"), 20) as EventFormat;
  const title = required(formData.get("title"), 120);
  const hostName = required(formData.get("hostName"), 120);
  const theme = required(formData.get("theme"), 120);
  const date = required(formData.get("date"), 20);
  const startsAt = required(formData.get("startsAt"), 12);
  const endsAt = required(formData.get("endsAt"), 12);
  const onlineMeetingUrl = required(formData.get("onlineMeetingUrl"), 300);
  const venueName = required(formData.get("venueName"), 160);
  const venueAddress = required(formData.get("venueAddress"), 220);
  const city = required(formData.get("city"), 120);

  if (!title || !hostName || !theme || !date || !startsAt || !endsAt) {
    redirect("/criar?erro=campos-obrigatorios");
  }

  const safeFormat: EventFormat = eventFormat === "online" ? "online" : "in_person";
  const safeType = EVENT_TYPES.includes(eventType) ? eventType : "outros";

  if (safeFormat === "online" && !onlineMeetingUrl) {
    redirect("/criar?erro=link-online-obrigatorio");
  }

  if (safeFormat === "in_person" && (!venueName || !venueAddress || !city)) {
    redirect("/criar?erro=local-obrigatorio");
  }

  const event = await repositories.events.create({
    ownerId: session.user.id,
    title,
    theme,
    eventType: safeType,
    hostName,
    eventFormat: safeFormat,
    onlineMeetingUrl: safeFormat === "online" ? onlineMeetingUrl : undefined,
    date,
    startsAt,
    endsAt,
    venueName: safeFormat === "online" ? "Evento online" : venueName,
    venueAddress: safeFormat === "online" ? onlineMeetingUrl : venueAddress,
    city: safeFormat === "online" ? "Online" : city
  });

  await repositories.audit.record({
    actorUserId: session.user.id,
    eventId: event.id,
    action: "event.created",
    targetType: "event",
    targetId: event.id,
    metadata: { source: "create_page", eventType: safeType, eventFormat: safeFormat }
  });

  redirect(`/dashboard/eventos/${event.id}?novo=1`);
}
