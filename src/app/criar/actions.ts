"use server";

import { revalidatePath } from "next/cache";
import type { CreateEventState } from "@/app/criar/create-event-state";
import { getCurrentSession } from "@/lib/auth/session";
import { repositories } from "@/lib/db";
import { getEventProfile, resolveEventFormat } from "@/lib/events/event-profile";
import { normalizeEventType } from "@/lib/events/event-types";
import { isValidPixKey, sanitizeText } from "@/lib/security/sanitize";
import type { EventType, GiftSuggestion } from "@/types/domain";

function required(value: FormDataEntryValue | null, maxLength: number) {
  return sanitizeText(value, maxLength);
}

function optional(value: FormDataEntryValue | null, maxLength: number) {
  const text = sanitizeText(value, maxLength);
  return text || undefined;
}

function parseAmount(value: FormDataEntryValue | null) {
  const raw = required(value, 20);
  if (!raw) return undefined;
  const amount = Number(raw.replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function parseGiftSuggestions(formData: FormData): GiftSuggestion[] {
  const raw = required(formData.get("giftSuggestionsJson"), 20000);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: GiftSuggestion[] = [];
    parsed.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const row = item as Record<string, unknown>;
      const title = String(row.title ?? "").trim();
      if (!title) return;
      items.push({
        id: String(row.id ?? `gift_${index}`),
        title,
        note: row.note ? String(row.note) : undefined,
        imageUrl: row.imageUrl ? String(row.imageUrl) : undefined,
        linkUrl: row.linkUrl ? String(row.linkUrl) : undefined
      });
    });
    return items;
  } catch {
    return [];
  }
}

function validationError(fieldError: string): CreateEventState {
  return { fieldError };
}

function createEventFailureMessage(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: string }).code);
    if (code === "23505") {
      return "Já existe um evento com esse nome. Tente um título um pouco diferente.";
    }
    if (code === "23503") {
      return "Sua conta ainda não está sincronizada. Faça logout e entre novamente.";
    }
    if (code === "28P01") {
      return "Não foi possível conectar ao banco de dados. Tente novamente em instantes.";
    }
  }
  if (error instanceof Error && error.message === "DATABASE_URL is not configured.") {
    return "Banco de dados não configurado neste ambiente.";
  }
  return "Não foi possível criar o evento agora. Tente novamente em instantes.";
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
  const hostName = optional(formData.get("hostName"), 120);
  const organizerName = optional(formData.get("organizerName"), 120);
  const theme = required(formData.get("theme"), 120);
  const story = optional(formData.get("story"), 4000);
  const date = required(formData.get("date"), 20);
  const startsAt = required(formData.get("startsAt"), 12) || "09:00";
  const endsAt = required(formData.get("endsAt"), 12) || "18:00";
  const onlineMeetingUrl = required(formData.get("onlineMeetingUrl"), 300);
  const venueName = required(formData.get("venueName"), 160);
  const venueAddress = required(formData.get("venueAddress"), 220);
  const venueZip = optional(formData.get("venueZip"), 12);
  const venueComplement = optional(formData.get("venueComplement"), 120);
  const venueReference = optional(formData.get("venueReference"), 160);
  const city = required(formData.get("city"), 120);
  const giftSuggestions = parseGiftSuggestions(formData);
  const rsvpDeadlineRaw = optional(formData.get("rsvpDeadline"), 20);
  const rsvpDeadlineEnabled = formData.get("rsvpDeadlineEnabled") === "1";
  const rsvpDeadline = rsvpDeadlineEnabled ? rsvpDeadlineRaw : undefined;
  const rsvpEnabled = profile.isFundraising ? formData.get("rsvpEnabled") === "1" : true;
  const locationMode = optional(formData.get("locationMode"), 20);
  const locationTbd = locationMode === "tbd";

  const pixKey = required(formData.get("pixKey"), 120);
  const pixReceiverName = required(formData.get("pixReceiverName"), 120);
  const goalAmount = parseAmount(formData.get("goalAmount"));
  const minPerPerson = parseAmount(formData.get("minPerPerson"));

  if (!title) {
    return validationError("campos-obrigatorios");
  }

  if (profile.isFundraising) {
    if (!pixKey || !pixReceiverName || !isValidPixKey(pixKey)) {
      return validationError("pix-obrigatorio");
    }
  } else if (!theme || !date || !startsAt || !endsAt || !organizerName) {
    return validationError("campos-obrigatorios");
  }

  const safeType = normalizeEventType(eventType);
  const resolvedHostName = hostName || organizerName || "Homenageado(a)";

  if (eventFormat === "online" && !onlineMeetingUrl) {
    return validationError("link-online-obrigatorio");
  }

  if (eventFormat === "in_person" && !locationTbd && (!venueName || !venueAddress || !city)) {
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
      hostName: resolvedHostName,
      organizerName: profile.isFundraising ? resolvedHostName : organizerName,
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
            : locationTbd
              ? "Local a definir"
              : venueName,
      venueAddress:
        eventFormat === "fundraising"
          ? "Contribuição via Pix"
          : eventFormat === "online"
            ? onlineMeetingUrl
            : locationTbd
              ? "A definir"
              : venueAddress,
      venueZip: eventFormat === "in_person" ? venueZip : undefined,
      venueComplement: eventFormat === "in_person" ? venueComplement : undefined,
      venueReference: eventFormat === "in_person" ? venueReference : undefined,
      city:
        eventFormat === "fundraising"
          ? "Online"
          : eventFormat === "online"
            ? "Online"
            : locationTbd
              ? city || "A definir"
              : city,
      rsvpEnabled,
      rsvpDeadline,
      giftSuggestions
    });

    if (profile.isFundraising || pixKey) {
      event = await repositories.events.updatePixSettings(event.id, session.user.id, {
        enabled: true,
        receiverName: pixReceiverName || resolvedHostName,
        key: pixKey,
        goalAmount,
        suggestedAmount: goalAmount,
        minPerPerson,
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
    return { error: createEventFailureMessage(error) };
  }
}
