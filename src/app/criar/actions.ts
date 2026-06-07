"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";
import type { EventType } from "@/types/domain";

const EVENT_TYPES: EventType[] = ["festa_infantil", "casamento", "aniversario", "formatura", "corporativo", "outros"];

function required(value: FormDataEntryValue | null, maxLength: number) {
  return sanitizeText(value, maxLength);
}

export async function createEventAction(formData: FormData) {
  const session = await requireSession();

  const eventType = required(formData.get("eventType"), 30) as EventType;
  const title = required(formData.get("title"), 120);
  const hostName = required(formData.get("hostName"), 120);
  const theme = required(formData.get("theme"), 120);
  const date = required(formData.get("date"), 20);
  const startsAt = required(formData.get("startsAt"), 12);
  const endsAt = required(formData.get("endsAt"), 12);
  const venueName = required(formData.get("venueName"), 160);
  const venueAddress = required(formData.get("venueAddress"), 220);
  const city = required(formData.get("city"), 120);

  if (!title || !hostName || !theme || !date || !startsAt || !endsAt || !venueName || !venueAddress || !city) {
    redirect("/criar?erro=campos-obrigatorios");
  }

  const safeType = EVENT_TYPES.includes(eventType) ? eventType : "outros";

  const event = await repositories.events.create({
    ownerId: session.user.id,
    title,
    theme,
    eventType: safeType,
    hostName,
    date,
    startsAt,
    endsAt,
    venueName,
    venueAddress,
    city
  });

  await repositories.audit.record({
    actorUserId: session.user.id,
    eventId: event.id,
    action: "event.created",
    targetType: "event",
    targetId: event.id,
    metadata: { source: "create_page", eventType: safeType }
  });

  redirect(`/dashboard/eventos/${event.id}?novo=1`);
}
