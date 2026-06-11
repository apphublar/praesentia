import { normalizeEventDateString } from "@/lib/events/datetime";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import type { Event } from "@/types/domain";

/** @deprecated Mantido por compatibilidade de tipos legados. */
export type CoverIncludeFields = {
  title?: boolean;
  date?: boolean;
  location?: boolean;
  hostName?: boolean;
  theme?: boolean;
};

export type CoverFieldsOverride = {
  eventTitle?: string;
  hostName?: string;
  theme?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  venueName?: string;
  venueAddress?: string;
  venueZip?: string;
  venueComplement?: string;
  city?: string;
  onlineMeetingUrl?: string;
};

export type CoverRequestSummary = {
  eventId: string;
  eventTitle: string;
  eventType: string;
  hostName: string;
  theme?: string;
  date: string;
  startsAt: string;
  endsAt: string;
  eventFormat: Event["eventFormat"];
  venueName: string;
  venueAddress?: string;
  venueZip?: string;
  venueComplement?: string;
  city: string;
  onlineMeetingUrl?: string;
  orientation?: string;
  photoInstructions?: string;
  editHint?: string;
  includeFields?: CoverIncludeFields;
};

export type CoverInvitationSpec = {
  imageSize: string;
  aspectRatio: string;
  visualDirection: string;
  photoInstructions: string | null;
  withHostPhoto: boolean;
  bottomTexts: string[];
};

export type CoverEditableFields = {
  eventTitle: string;
  hostName: string;
  theme: string;
  date: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  venueZip: string;
  venueComplement: string;
  city: string;
  onlineMeetingUrl: string;
};

export const COVER_IMAGE_FORMAT = {
  aspectRatio: "9:16",
  size: "1024×1536",
  apiSize: "1024x1536",
  label: "Vertical 9:16 · WhatsApp e Stories"
} as const;

export const DEFAULT_PHOTO_INSTRUCTIONS =
  "Use a foto real do homenageado. Recorte a pessoa, remova o fundo original e coloque no centro do convite em moldura circular, com borda dourada suave.";

export function formatCoverDateLine(date: string) {
  return formatEventDateLine(date);
}

function isPlaceholderText(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return !normalized || /^teste(\s|$)/.test(normalized) || normalized === "tema";
}

function fieldOrNull(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || isPlaceholderText(trimmed)) return null;
  return trimmed;
}

function formatCoverTimeLine(startsAt: string, endsAt: string) {
  const start = startsAt?.trim();
  const end = endsAt?.trim();
  if (!start) return null;
  if (end && end !== start) return `${start} às ${end}`;
  return start;
}

function buildLocationLine(summary: CoverRequestSummary) {
  if (summary.eventFormat === "fundraising") return "Contribuição via Pix";
  if (summary.eventFormat === "online") {
    return fieldOrNull(summary.onlineMeetingUrl) ?? "Evento online";
  }

  const parts: string[] = [];
  const venue = summary.venueName?.trim();
  const city = summary.city?.trim();
  const address = summary.venueAddress?.trim();
  const zip = summary.venueZip?.trim();
  const complement = summary.venueComplement?.trim();

  if (venue && !isPlaceholderText(venue)) parts.push(venue);
  if (city && !isPlaceholderText(city)) parts.push(city);

  const addressParts: string[] = [];
  if (address && !isPlaceholderText(address)) addressParts.push(address);
  if (complement) addressParts.push(complement);
  if (zip) addressParts.push(`CEP ${zip}`);

  const headline = parts.join(", ");
  const addressLine = addressParts.join(" — ");

  if (headline && addressLine) return `${headline} — ${addressLine}`;
  return headline || addressLine || null;
}

/** Textos que entram somente na faixa inferior — apenas campos preenchidos pelo cliente. */
export function buildCoverBottomTexts(summary: CoverRequestSummary) {
  const lines: string[] = [];

  const title = fieldOrNull(summary.eventTitle);
  const theme = fieldOrNull(summary.theme);
  const hostName = fieldOrNull(summary.hostName);
  const dateLine = summary.date?.trim() ? formatCoverDateLine(summary.date) : null;
  const timeLine =
    summary.startsAt?.trim() || summary.endsAt?.trim()
      ? formatCoverTimeLine(summary.startsAt, summary.endsAt)
      : null;
  const locationLine = buildLocationLine(summary);

  if (title) lines.push(title);
  if (theme && theme !== title) lines.push(theme);
  if (hostName) lines.push(`Venha celebrar com ${hostName}!`);
  if (dateLine) lines.push(`DATA: ${dateLine}`);
  if (timeLine) lines.push(`HORÁRIO: ${timeLine}`);
  if (locationLine) lines.push(`LOCAL: ${locationLine}`);

  return lines;
}

export function buildCoverInvitationSpec(
  summary: CoverRequestSummary,
  options: { withHostPhoto: boolean; size?: string }
): CoverInvitationSpec {
  const visualDirection = [summary.orientation?.trim(), summary.editHint?.trim()].filter(Boolean).join("\n\n");

  const photoInstructions = options.withHostPhoto
    ? summary.photoInstructions?.trim() || DEFAULT_PHOTO_INSTRUCTIONS
    : null;

  return {
    imageSize: options.size ?? COVER_IMAGE_FORMAT.apiSize,
    aspectRatio: COVER_IMAGE_FORMAT.aspectRatio,
    visualDirection,
    photoInstructions,
    withHostPhoto: options.withHostPhoto,
    bottomTexts: buildCoverBottomTexts(summary)
  };
}

export function buildPremiumCoverPrompt(spec: CoverInvitationSpec) {
  const bottomBlock =
    spec.bottomTexts.length > 0
      ? spec.bottomTexts.map((line) => `- "${line}"`).join("\n")
      : "- (nenhum texto de rodapé — não invente data, horário ou local)";

  const photoBlock = spec.withHostPhoto
    ? `PHOTO OF HONOREE (follow EXACTLY):
${spec.photoInstructions}

Use the REAL person from the uploaded reference photo.`
    : "No reference photo — do not add a person photo.";

  return `Create a premium vertical party invitation in Brazilian Portuguese.

IMAGE FORMAT (FIXED — do not change):
Aspect ratio ${spec.aspectRatio}, size ${spec.imageSize}, WhatsApp/Instagram Story format.

ORGANIZER VISUAL DIRECTION (follow EXACTLY — do not add elements, colors or styles not written here):
${spec.visualDirection || "Clean elegant invitation background. No extra decorative clipart."}

${photoBlock}

LAYOUT (mandatory):
1. Top and middle area: visual design and photo treatment exactly as described above.
2. Bottom area ONLY: render the Portuguese text lines listed below, legibly, with icons if appropriate.
3. Do NOT place event information (date, time, location, names) outside the bottom area.
4. Do NOT add any text that is not listed in the bottom section below.

BOTTOM TEXT LINES (Portuguese — copy character by character, preserve accents é á ã ç ô):
${bottomBlock}

LANGUAGE:
- Brazilian Portuguese only for visible text.
- Preserve all accents exactly as written.
- Do not add English words.
- Do not invent fields the client left empty.

QUALITY:
Professional invitation design, clear hierarchy, no watermarks, no app logos, no placeholder text.`;
}

export function buildInitialCoverEditableFields(input: CoverFormEventInput): CoverEditableFields {
  return {
    eventTitle: isPlaceholderText(input.eventTitle) ? "" : input.eventTitle.trim(),
    hostName: isPlaceholderText(input.hostName) ? "" : input.hostName.trim(),
    theme: isPlaceholderText(input.theme) ? "" : (input.theme ?? "").trim(),
    date: normalizeEventDateString(input.date),
    startsAt: input.startsAt?.trim().slice(0, 5) ?? "",
    endsAt: input.endsAt?.trim().slice(0, 5) ?? "",
    venueName: isPlaceholderText(input.venueName) ? "" : input.venueName.trim(),
    venueAddress: isPlaceholderText(input.venueAddress) ? "" : (input.venueAddress ?? "").trim(),
    venueZip: input.venueZip?.trim() ?? "",
    venueComplement: input.venueComplement?.trim() ?? "",
    city: isPlaceholderText(input.city) ? "" : input.city.trim(),
    onlineMeetingUrl: input.onlineMeetingUrl?.trim() ?? ""
  };
}

export function coverEditableFieldsToOverride(fields: CoverEditableFields): CoverFieldsOverride {
  return { ...fields };
}

/** Orientação livre — sem texto pré-definido. */
export function buildDefaultCoverOrientation(_input?: CoverFormEventInput) {
  return "";
}

export type CoverFormEventInput = {
  eventTitle: string;
  eventType: string;
  hostName: string;
  theme?: string;
  date: string;
  startsAt: string;
  endsAt: string;
  eventFormat: Event["eventFormat"];
  venueName: string;
  venueAddress?: string;
  venueZip?: string;
  venueComplement?: string;
  city: string;
  onlineMeetingUrl?: string;
};

export function toCoverFormEventInput(input: {
  eventTitle?: string;
  eventType?: string;
  eventHostName?: string;
  eventTheme?: string;
  eventDate?: string;
  eventStartsAt?: string;
  eventEndsAt?: string;
  eventFormat?: Event["eventFormat"];
  eventVenueName?: string;
  eventVenueAddress?: string;
  eventVenueZip?: string;
  eventVenueComplement?: string;
  eventCity?: string;
  onlineMeetingUrl?: string;
}): CoverFormEventInput {
  return {
    eventTitle: input.eventTitle ?? "",
    eventType: input.eventType ?? "outros",
    hostName: input.eventHostName ?? "",
    theme: input.eventTheme,
    date: normalizeEventDateString(input.eventDate),
    startsAt: input.eventStartsAt?.slice(0, 5) ?? "",
    endsAt: input.eventEndsAt?.slice(0, 5) ?? "",
    eventFormat: input.eventFormat ?? "in_person",
    venueName: input.eventVenueName ?? "",
    venueAddress: input.eventVenueAddress,
    venueZip: input.eventVenueZip,
    venueComplement: input.eventVenueComplement,
    city: input.eventCity ?? "",
    onlineMeetingUrl: input.onlineMeetingUrl
  };
}

export function mergeCoverRequestSummary(
  event: Pick<
    Event,
    | "id"
    | "title"
    | "eventType"
    | "hostName"
    | "theme"
    | "date"
    | "startsAt"
    | "endsAt"
    | "eventFormat"
    | "venueName"
    | "venueAddress"
    | "city"
    | "onlineMeetingUrl"
  >,
  input: {
    orientation?: string;
    photoInstructions?: string;
    editHint?: string;
    coverFields?: CoverFieldsOverride;
  }
): CoverRequestSummary {
  const fields = input.coverFields ?? {};
  const pick = (key: keyof CoverFieldsOverride, fallback: string) => {
    if (key in fields) return String(fields[key] ?? "").trim();
    return fallback.trim();
  };

  return {
    eventId: event.id,
    eventTitle: pick("eventTitle", event.title),
    eventType: event.eventType,
    hostName: pick("hostName", event.hostName),
    theme: pick("theme", event.theme ?? ""),
    date: pick("date", event.date),
    startsAt: pick("startsAt", event.startsAt),
    endsAt: pick("endsAt", event.endsAt),
    eventFormat: event.eventFormat,
    venueName: pick("venueName", event.venueName),
    venueAddress: pick("venueAddress", event.venueAddress ?? ""),
    venueZip: pick("venueZip", ""),
    venueComplement: pick("venueComplement", ""),
    city: pick("city", event.city),
    onlineMeetingUrl: pick("onlineMeetingUrl", event.onlineMeetingUrl ?? ""),
    orientation: input.orientation,
    photoInstructions: input.photoInstructions,
    editHint: input.editHint
  };
}
