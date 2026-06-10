"use server";

import { revalidatePath } from "next/cache";
import type { CreateEventState } from "@/app/criar/create-event-state";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEventProfile, resolveEventFormat } from "@/lib/events/event-profile";
import { normalizeEventType } from "@/lib/events/event-types";
import { isValidPixKey, sanitizeText } from "@/lib/security/sanitize";
import type { EventType } from "@/types/domain";

function required(value: FormDataEntryValue | null, maxLength: number) {
  return sanitizeText(value, maxLength);
}

function optional(value: FormDataEntryValue | null, maxLength: number) {
  const text = sanitizeText(value, maxLength);
  return text || undefined;
}

function validationError(fieldError: string): CreateEventState {
  return { fieldError };
}

export async function createEventAction(_prev: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const session = await getCurrentSession();
  if (!session) {
    return { error: "Sessão expirada. Faça login novamente para continuar." };
  }

  const eventType = normalizeEventType(required(formData.get("eventType"), 30)) as EventType;
  const profile = getEventProfile(eventType);
  const eventFormat = resolveEventFormat(eventType, required(formData.get("eventFormat"), 20));

  const title = required(formData.get("title"), 120);
  const hostName = required(formData.get("hostName"), 120);
  const theme = required(formData.get("theme"), 120);
  const story = optional(formData.get("story"), 4000);
  const date = required(formData.get("date"), 20);
  const startsAt = required(formData.get("startsAt"), 12) || "09:00";
  const endsAt = required(formData.get("endsAt"), 12) || "18:00";
  const onlineMeetingUrl = required(formData.get("onlineMeetingUrl"), 300);
  const venueName = required(formData.get("venueName"), 160);
  const venueAddress = required(formData.get("venueAddress"), 220);
  const city = required(formData.get("city"), 120);

  const pixKey = required(formData.get("pixKey"), 120);
  const pixReceiverName = required(formData.get("pixReceiverName"), 120);
  const goalAmountRaw = required(formData.get("goalAmount"), 20);
  const goalAmount = goalAmountRaw ? Number(goalAmountRaw.replace(",", ".")) : undefined;

  if (!title || !hostName) {
    return validationError("campos-obrigatorios");
  }

  if (profile.isFundraising) {
    if (!pixKey || !pixReceiverName || !isValidPixKey(pixKey)) {
      return validationError("pix-obrigatorio");
    }
  } else if (!theme || !date || !startsAt || !endsAt) {
    return validationError("campos-obrigatorios");
  }

  const safeType = normalizeEventType(eventType);

  if (eventFormat === "online" && !onlineMeetingUrl) {
    return validationError("link-online-obrigatorio");
  }

  if (eventFormat === "in_person" && (!venueName || !venueAddress || !city)) {
    return validationError("local-obrigatorio");
  }

  const today = new Date().toISOString().slice(0, 10);
  const resolvedDate = date || today;

  try {
    let event = await repositories.events.create({
      ownerId: session.user.id,
      title,
      theme: profile.isFundraising ? (theme || "Arrecadação") : theme,
      eventType: safeType,
      hostName,
      eventFormat,
      onlineMeetingUrl: eventFormat === "online" ? onlineMeetingUrl : undefined,
      date: resolvedDate,
      startsAt,
      endsAt,
      venueName:
        eventFormat === "fundraising"
          ? "Vaquinha online"
          : eventFormat === "online"
            ? "Evento online"
            : venueName,
      venueAddress:
        eventFormat === "fundraising"
          ? "Contribuição via Pix"
          : eventFormat === "online"
            ? onlineMeetingUrl
            : venueAddress,
      city: eventFormat === "fundraising" ? "Online" : eventFormat === "online" ? "Online" : city
    });

    if (profile.isFundraising || pixKey) {
      event = await repositories.events.updatePixSettings(event.id, session.user.id, {
        enabled: true,
        receiverName: pixReceiverName || hostName,
        key: pixKey,
        suggestedAmount: goalAmount && goalAmount > 0 ? goalAmount : undefined,
        message: story || theme
      });
    }

    if (story) {
      event = await repositories.events.setInviteCopy(event.id, session.user.id, {
        headline: title,
        message: story,
        whatsapp: profile.isFundraising
          ? `Apoie a vaquinha "${title}". Contribua via Pix: {{link}}`
          : `Você está convidado(a) para ${title}. Confirme aqui: {{link}}`,
        hashtags: profile.isFundraising ? ["#vaquinha", "#pix", "#praesentia"] : []
      });
    }

    try {
      await repositories.audit.record({
        actorUserId: session.user.id,
        eventId: event.id,
        action: "event.created",
        targetType: "event",
        targetId: event.id,
        metadata: { source: "create_page", eventType: safeType, eventFormat }
      });
    } catch (auditError) {
      console.error("[createEventAction] audit.record failed", auditError);
    }

    revalidatePath("/dashboard", "layout");
    return { eventId: event.id };
  } catch (error) {
    console.error("[createEventAction] failed", error);
    return { error: "Não foi possível criar o evento agora. Tente novamente em instantes." };
  }
}
