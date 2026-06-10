import { formatEventDateLine } from "@/lib/events/format-event-date";
import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event, EventType } from "@/types/domain";

/** @deprecated Campos vazios no coverFields já definem o que entra na arte. */
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
  editHint?: string;
  includeFields?: CoverIncludeFields;
};

export type CoverInvitationSpec = {
  eventType: string;
  eventTypeLabel: string;
  invitationTitle: string;
  honoreeName: string;
  celebrationLine: string;
  decorativeHeader: string;
  dateLine: string | null;
  timeLine: string | null;
  locationLine: string | null;
  visualTheme: string;
  colorPalette: string[];
  decorativeElements: string[];
  aesthetic: string;
  typography: string;
  layoutDescription: string;
  withHostPhoto: boolean;
  photoIntegration: string;
  userBrief: string;
  exactTexts: string[];
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

const EVENT_VISUAL_PRESETS: Partial<
  Record<
    EventType,
    { palette: string[]; elements: string[]; aesthetic: string; defaultTheme?: string; decorativeHeader?: string }
  >
> = {
  aniversario: {
    palette: ["soft baby pink", "white", "soft gold"],
    elements: ["smiling sun illustration", "fluffy clouds", "delicate stars", "number balloon", "small hearts", "soft watercolor accents"],
    aesthetic: "luxury kids birthday invitation, cute but sophisticated, Instagram Story ready",
    defaultTheme: "Festa de Aniversário",
    decorativeHeader: "Aniversário"
  },
  festa_infantil: {
    palette: ["soft baby pink", "white", "soft gold", "pastel blue"],
    elements: ["smiling sun", "fluffy clouds", "stars", "balloon", "confetti", "watercolor details"],
    aesthetic: "premium children's party invitation, playful and elegant",
    defaultTheme: "Festa Infantil",
    decorativeHeader: "Festa Infantil"
  },
  cha_fraldas: {
    palette: ["soft mint", "white", "pastel yellow"],
    elements: ["clouds", "stars", "soft ribbons", "baby-themed watercolor accents"],
    aesthetic: "gentle baby shower invitation, warm and delicate",
    decorativeHeader: "Chá de Fraldas"
  },
  cha_revelacao: {
    palette: ["soft pink", "soft blue", "white", "gold accents"],
    elements: ["balloons", "clouds", "question mark motif", "stars"],
    aesthetic: "gender reveal party invitation, festive and modern",
    decorativeHeader: "Chá Revelação"
  },
  festa_15_anos: {
    palette: ["blush pink", "white", "gold", "champagne"],
    elements: ["elegant florals", "subtle sparkles", "crown motif", "soft gradient background"],
    aesthetic: "quinceanera luxury invitation, elegant and feminine",
    decorativeHeader: "15 Anos"
  },
  casamento: {
    palette: ["ivory", "white", "soft gold", "sage green"],
    elements: ["elegant florals", "minimal line art", "soft arch frame"],
    aesthetic: "wedding invitation, refined and romantic",
    decorativeHeader: "Casamento"
  },
  formatura: {
    palette: ["navy blue", "white", "gold"],
    elements: ["graduation cap motif", "confetti", "clean geometric accents"],
    aesthetic: "graduation celebration invitation, modern and proud",
    decorativeHeader: "Formatura"
  },
  batizado: {
    palette: ["white", "soft blue", "gold", "ivory"],
    elements: ["dove motif", "soft clouds", "cross or angel watercolor accent"],
    aesthetic: "baptism invitation, serene and elegant",
    decorativeHeader: "Batizado"
  }
};

export function formatCoverDateLine(date: string) {
  return formatEventDateLine(date);
}

function formatCoverTimeLine(startsAt: string, endsAt: string) {
  const start = startsAt?.trim();
  const end = endsAt?.trim();
  if (!start) return null;
  if (end && end !== start) return `${start} às ${end}`;
  return start;
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

function resolveInvitationTitle(summary: CoverRequestSummary) {
  const theme = fieldOrNull(summary.theme);
  if (theme) return theme;
  const title = fieldOrNull(summary.eventTitle);
  if (title) return title;
  const preset = EVENT_VISUAL_PRESETS[summary.eventType as EventType];
  return preset?.defaultTheme ?? "Convite Especial";
}

function resolveHonoreeName(summary: CoverRequestSummary) {
  const host = fieldOrNull(summary.hostName);
  if (host) return host;
  const title = fieldOrNull(summary.eventTitle);
  if (title) return title;
  return null;
}

function resolveCelebrationLine(honoreeName: string | null) {
  if (!honoreeName) return null;
  return `Venha celebrar com ${honoreeName}!`;
}

function resolveDecorativeHeader(summary: CoverRequestSummary, invitationTitle: string) {
  const preset = EVENT_VISUAL_PRESETS[summary.eventType as EventType];
  const theme = fieldOrNull(summary.theme);
  if (theme && theme !== invitationTitle) return theme;
  return preset?.decorativeHeader ?? invitationTitle;
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

function inferPaletteFromBrief(brief: string, fallback: string[]) {
  const text = brief.toLowerCase();
  if (/dourad|gold|ouro/.test(text) && /rosa|pink/.test(text)) return ["soft baby pink", "white", "soft gold"];
  if (/azul|blue|marinho|navy/.test(text)) return ["soft blue", "white", "gold accents"];
  if (/verde|green|sage/.test(text)) return ["sage green", "white", "soft gold"];
  if (/rosa|pink|rose/.test(text)) return ["soft baby pink", "white", "soft gold"];
  return fallback;
}

function inferElementsFromBrief(brief: string, fallback: string[]) {
  const text = brief.toLowerCase();
  const extras: string[] = [];
  if (/sol|sun|volta ao sol/.test(text)) extras.push("smiling sun illustration");
  if (/nuvem|cloud/.test(text)) extras.push("fluffy clouds");
  if (/estrela|star/.test(text)) extras.push("delicate stars");
  if (/balão|balao|balloon/.test(text)) extras.push("number balloon");
  if (/flor|flower/.test(text)) extras.push("soft floral watercolor accents");
  if (/aquarela|watercolor/.test(text)) extras.push("watercolor texture details");
  return extras.length ? [...new Set([...extras, ...fallback.slice(0, 3)])] : fallback;
}

export function buildCoverInvitationSpec(
  summary: CoverRequestSummary,
  options: { withHostPhoto: boolean; size: string }
): CoverInvitationSpec {
  const eventType = summary.eventType as EventType;
  const preset = EVENT_VISUAL_PRESETS[eventType];
  const eventTypeLabel = EVENT_TYPE_LABELS[eventType] ?? "Evento especial";
  const userBrief =
    summary.orientation?.trim() ||
    summary.editHint?.trim() ||
    preset?.defaultTheme ||
    `Convite premium vertical para ${eventTypeLabel}`;

  const invitationTitle = resolveInvitationTitle(summary);
  const honoreeName = resolveHonoreeName(summary);
  const celebrationLine = honoreeName ? resolveCelebrationLine(honoreeName) : null;
  const decorativeHeader = resolveDecorativeHeader(summary, invitationTitle);

  const dateLine = summary.date?.trim() ? formatCoverDateLine(summary.date) : null;
  const timeLine =
    summary.startsAt?.trim() || summary.endsAt?.trim()
      ? formatCoverTimeLine(summary.startsAt, summary.endsAt)
      : null;
  const locationLine = buildLocationLine(summary);

  const exactTexts: string[] = [];
  if (fieldOrNull(summary.theme) && summary.theme!.trim() !== invitationTitle) {
    exactTexts.push(summary.theme!.trim());
  } else if (fieldOrNull(summary.eventTitle) && summary.eventTitle.trim() !== invitationTitle) {
    exactTexts.push(summary.eventTitle.trim());
  }
  exactTexts.push(decorativeHeader);
  if (celebrationLine) exactTexts.push(celebrationLine);
  if (dateLine) exactTexts.push(`DATA: ${dateLine}`);
  if (timeLine) exactTexts.push(`HORÁRIO: ${timeLine}`);
  if (locationLine) exactTexts.push(`LOCAL: ${locationLine}`);

  const palette = inferPaletteFromBrief(userBrief, preset?.palette ?? ["white", "soft pastel tones", "gold accents"]);
  const decorativeElements = inferElementsFromBrief(
    `${userBrief} ${invitationTitle}`,
    preset?.elements ?? ["soft decorative accents", "elegant borders", "subtle stars"]
  );

  return {
    eventType: summary.eventType,
    eventTypeLabel,
    invitationTitle,
    honoreeName: honoreeName ?? "",
    celebrationLine: celebrationLine ?? "",
    decorativeHeader,
    dateLine,
    timeLine,
    locationLine,
    visualTheme: userBrief,
    colorPalette: palette,
    decorativeElements,
    aesthetic: preset?.aesthetic ?? "premium Brazilian party invitation, clean layout, Instagram Story format",
    typography: "elegant mix of script and sans-serif, highly readable Brazilian Portuguese text, clear hierarchy",
    layoutDescription: `Vertical invitation ${options.size}, clear top-to-bottom hierarchy: decorative header in Portuguese, central focal area${options.withHostPhoto ? " with real photo" : ""}, structured info blocks with icons for date/time/location, generous spacing, professional print-ready finish`,
    withHostPhoto: options.withHostPhoto,
    photoIntegration: options.withHostPhoto
      ? "Use the REAL person from the uploaded photo. Completely remove the original background (no car seat, no room, no clutter). Create a clean cutout and place the person inside a soft circular frame as the main focal point. Preserve the real face and expression. Integrate naturally with the invitation design."
      : "No reference photo. Use illustrated celebration elements only.",
    userBrief,
    exactTexts
  };
}

export function buildPremiumCoverPrompt(spec: CoverInvitationSpec) {
  const textBlock = spec.exactTexts.map((line) => `- "${line}"`).join("\n");
  const languageRules =
    "LANGUAGE (CRITICAL): Every visible word in the image MUST be Brazilian Portuguese. " +
    "Never use English decorative words such as celebration, birthday, party, welcome, or similar. " +
    "Only use the exact Portuguese strings listed below.";

  const shared = `${languageRules}

DECORATIVE HEADER (Portuguese, large script area):
"${spec.decorativeHeader}"

VISUAL DIRECTION FROM ORGANIZER:
${spec.visualTheme}

COLOR PALETTE (strict):
${spec.colorPalette.join(", ")}

DECORATIVE ELEMENTS:
${spec.decorativeElements.join(", ")}

LAYOUT:
${spec.layoutDescription}

TYPOGRAPHY:
${spec.typography}

EXACT PORTUGUESE TEXT TO RENDER LEGIBLY IN THE IMAGE:
${textBlock}

STYLE:
${spec.aesthetic}
high-end party invitation,
soft lighting,
professional graphic design,
WhatsApp/Instagram Story format,
generous whitespace,
clear visual hierarchy,
no app logos,
no watermarks,
no placeholder text,
no English text,
no misspelled dates.`;

  if (spec.withHostPhoto) {
    return `Create a premium vertical party invitation design in Brazilian Portuguese.

Event type: ${spec.eventTypeLabel}
Honoree: ${spec.honoreeName || "celebrated guest"}

PHOTO INTEGRATION (CRITICAL):
${spec.photoIntegration}

${shared}`;
  }

  return `Create a premium vertical party invitation in Brazilian Portuguese.

Event type: ${spec.eventTypeLabel}

${shared}`;
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

export const COVER_IMAGE_FORMAT = {
  aspectRatio: "9:16",
  size: "1024×1536",
  label: "Vertical 9:16 · WhatsApp e Stories"
} as const;

const DEFAULT_ORIENTATION_HINTS_PT: Partial<Record<EventType, string>> = {
  aniversario:
    "Paleta rosa bebê, branco e dourado. Sol sorridente, nuvens fofas, estrelas delicadas e balão festivo. Estilo convite premium de luxo infantil.",
  festa_infantil:
    "Cores pastel alegres, sol, nuvens, estrelas, confetes e detalhes em aquarela. Visual festivo, delicado e elegante.",
  cha_fraldas: "Tons suaves mint, branco e amarelo pastel. Nuvens, estrelas e laços delicados. Clima acolhedor de chá de bebê.",
  cha_revelacao: "Rosa e azul pastel com detalhes dourados. Balões, nuvens e estrelas. Visual moderno e festivo.",
  festa_15_anos: "Rosa blush, branco e dourado. Flores elegantes, brilhos sutis e coroa. Estilo sofisticado e feminino.",
  casamento: "Ivory, branco, dourado e verde sage. Flores elegantes e moldura suave. Convite romântico e refinado.",
  formatura: "Azul marinho, branco e dourado. Confetes e detalhes geométricos modernos.",
  batizado: "Branco, azul claro e dourado. Pomba, nuvens suaves e detalhes serenos."
};

export function buildInitialCoverEditableFields(input: CoverFormEventInput): CoverEditableFields {
  return {
    eventTitle: isPlaceholderText(input.eventTitle) ? "" : input.eventTitle.trim(),
    hostName: isPlaceholderText(input.hostName) ? "" : input.hostName.trim(),
    theme: isPlaceholderText(input.theme) ? "" : (input.theme ?? "").trim(),
    date: input.date?.trim() ?? "",
    startsAt: input.startsAt?.trim() ?? "",
    endsAt: input.endsAt?.trim() ?? "",
    venueName: isPlaceholderText(input.venueName) ? "" : input.venueName.trim(),
    venueAddress: isPlaceholderText(input.venueAddress) ? "" : (input.venueAddress ?? "").trim(),
    venueZip: input.venueZip?.trim() ?? "",
    venueComplement: input.venueComplement?.trim() ?? "",
    city: isPlaceholderText(input.city) ? "" : input.city.trim(),
    onlineMeetingUrl: input.onlineMeetingUrl?.trim() ?? ""
  };
}

export function coverEditableFieldsToOverride(fields: CoverEditableFields): CoverFieldsOverride {
  return {
    eventTitle: fields.eventTitle,
    hostName: fields.hostName,
    theme: fields.theme,
    date: fields.date,
    startsAt: fields.startsAt,
    endsAt: fields.endsAt,
    venueName: fields.venueName,
    venueAddress: fields.venueAddress,
    venueZip: fields.venueZip,
    venueComplement: fields.venueComplement,
    city: fields.city,
    onlineMeetingUrl: fields.onlineMeetingUrl
  };
}

export function buildDefaultCoverOrientation(input: CoverFormEventInput) {
  const eventType = input.eventType as EventType;
  const hint =
    DEFAULT_ORIENTATION_HINTS_PT[eventType] ??
    "Convite vertical premium com cores pastel harmoniosas, tipografia elegante e layout clean para WhatsApp.";

  const themePart = !isPlaceholderText(input.theme)
    ? `Tema visual: ${input.theme!.trim()}.`
    : !isPlaceholderText(input.eventTitle)
      ? `Celebrando: ${input.eventTitle.trim()}.`
      : "";

  return [themePart, hint].filter(Boolean).join(" ");
}

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
    date: input.eventDate ?? "",
    startsAt: input.eventStartsAt ?? "",
    endsAt: input.eventEndsAt ?? "",
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
    editHint: input.editHint
  };
}
