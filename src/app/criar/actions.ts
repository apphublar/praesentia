"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { sanitizeText } from "@/lib/security/sanitize";

function required(value: FormDataEntryValue | null, maxLength: number) {
  return sanitizeText(value, maxLength);
}

export async function createEventAction(formData: FormData) {
  const session = await requireSession();

  const title = required(formData.get("title"), 120);
  const theme = required(formData.get("theme"), 120);
  const date = required(formData.get("date"), 20);
  const startsAt = required(formData.get("startsAt"), 12);
  const endsAt = required(formData.get("endsAt"), 12);
  const venueName = required(formData.get("venueName"), 160);
  const venueAddress = required(formData.get("venueAddress"), 220);
  const city = required(formData.get("city"), 120);

  if (!title || !theme || !date || !startsAt || !endsAt || !venueName || !venueAddress || !city) {
    redirect("/criar?erro=campos-obrigatorios");
  }

  const event = await repositories.events.create({
    ownerId: session.user.id,
    title,
    theme,
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
    metadata: { source: "create_page" }
  });

  redirect(`/dashboard/eventos/${event.id}`);
}
