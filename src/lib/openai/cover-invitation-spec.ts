import { EVENT_TYPE_LABELS } from "@/lib/events/event-types";
import type { Event, EventType } from "@/types/domain";

export type CoverIncludeFields = {
  title?: boolean;
  date?: boolean;
  location?: boolean;
  hostName?: boolean;
  theme?: boolean;
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
  city: string;
  onlineMeetingUrl?: string;
  orientation?: string;
  editHint?: string;
  includeFields: CoverIncludeFields;
};

export type CoverInvitationSpec = {
  eventType: string;
  eventTypeLabel: string;
  invitationTitle: string;
  honoreeName: string;
  celebrationLine: string;
  dateLine: string | null;
  timeLine: string | null;
  locationLine: string | null;
  locationDetail: string | null;
  organizerLine: string | null;
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

const EVENT_VISUAL_PRESETS: Partial<
  Record<
    EventType,
    { palette: string[]; elements: string[]; aesthetic: string; defaultTheme?: string }
  >
> = {
  aniversario: {
    palette: ["soft baby pink", "white", "soft gold"],
    elements: ["smiling sun illustration", "fluffy clouds", "delicate stars", "number balloon", "small hearts", "soft watercolor accents"],
    aesthetic: "luxury kids birthday invitation, cute but sophisticated, Instagram Story ready",
    defaultTheme: "celebration birthday party"
  },
  festa_infantil: {
    palette: ["soft baby pink", "white", "soft gold", "pastel blue"],
    elements: ["smiling sun", "fluffy clouds", "stars", "balloon", "confetti", "watercolor details"],
    aesthetic: "premium children's party invitation, playful and elegant",
    defaultTheme: "festa infantil especial"
  },
  cha_fraldas: {
    palette: ["soft mint", "white", "pastel yellow"],
    elements: ["clouds", "stars", "soft ribbons", "baby-themed watercolor accents"],
    aesthetic: "gentle baby shower invitation, warm and delicate"
  },
  cha_revelacao: {
    palette: ["soft pink", "soft blue", "white", "gold accents"],
    elements: ["balloons", "clouds", "question mark motif", "stars"],
    aesthetic: "gender reveal party invitation, festive and modern"
  },
  festa_15_anos: {
    palette: ["blush pink", "white", "gold", "champagne"],
    elements: ["elegant florals", "subtle sparkles", "crown motif", "soft gradient background"],
    aesthetic: "quinceanera luxury invitation, elegant and feminine"
  },
  casamento: {
    palette: ["ivory", "white", "soft gold", "sage green"],
    elements: ["elegant florals", "minimal line art", "soft arch frame"],
    aesthetic: "wedding invitation, refined and romantic"
  },
  formatura: {
    palette: ["navy blue", "white", "gold"],
    elements: ["graduation cap motif", "confetti", "clean geometric accents"],
    aesthetic: "graduation celebration invitation, modern and proud"
  },
  batizado: {
    palette: ["white", "soft blue", "gold", "ivory"],
    elements: ["dove motif", "soft clouds", "cross or angel watercolor accent"],
    aesthetic: "baptism invitation, serene and elegant"
  }
};

function parseEventDate(date: string) {
  if (!date?.trim()) return null;
  const value = date.trim();
  const candidates = [value, `${value}T12:00:00`, value.replace(/\//g, "-")];
  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function formatCoverDateLine(date: string) {
  const parsed = parseEventDate(date);
  if (!parsed) return null;
  return parsed.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
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

function resolveInvitationTitle(summary: CoverRequestSummary) {
  if (!isPlaceholderText(summary.theme)) return summary.theme!.trim();
  if (!isPlaceholderText(summary.eventTitle)) return summary.eventTitle.trim();
  const preset = EVENT_VISUAL_PRESETS[summary.eventType as EventType];
  return preset?.defaultTheme ?? "Convite especial";
}

function resolveHonoreeName(summary: CoverRequestSummary) {
  if (!isPlaceholderText(summary.hostName)) return summary.hostName.trim();
  if (!isPlaceholderText(summary.eventTitle)) return summary.eventTitle.trim();
  return "Homenageado(a)";
}

function resolveCelebrationLine(summary: CoverRequestSummary, honoreeName: string, title: string) {
  if (!isPlaceholderText(summary.eventTitle) && summary.eventTitle.trim() !== title) {
    return summary.eventTitle.trim();
  }
  return `Venha celebrar com ${honoreeName}!`;
}

function resolveLocation(summary: CoverRequestSummary) {
  if (summary.eventFormat === "fundraising") {
    return { line: "Contribuição via Pix", detail: null as string | null };
  }
  if (summary.eventFormat === "online") {
    return {
      line: "Evento online",
      detail: summary.onlineMeetingUrl?.trim() || null
    };
  }
  const venue = summary.venueName?.trim();
  const city = summary.city?.trim();
  const address = summary.venueAddress?.trim();
  const line = [venue, city].filter(Boolean).join(", ") || "Local a confirmar";
  return { line, detail: address && address !== venue ? address : null };
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
  const preset = EVENT_VISUAL_PRESETS[eventType] ?? EVENT_VISUAL_PRESETS.outros;
  const eventTypeLabel = EVENT_TYPE_LABELS[eventType] ?? "Evento especial";
  const userBrief =
    summary.orientation?.trim() ||
    summary.editHint?.trim() ||
    preset?.defaultTheme ||
    `Convite premium vertical para ${eventTypeLabel}`;

  const invitationTitle = resolveInvitationTitle(summary);
  const honoreeName = resolveHonoreeName(summary);
  const celebrationLine = resolveCelebrationLine(summary, honoreeName, invitationTitle);
  const location = resolveLocation(summary);

  const include = summary.includeFields;
  const dateLine = include.date !== false ? formatCoverDateLine(summary.date) : null;
  const timeLine = include.date !== false ? formatCoverTimeLine(summary.startsAt, summary.endsAt) : null;
  const locationLine = include.location !== false ? location.line : null;
  const locationDetail = include.location !== false ? location.detail : null;
  const organizerLine =
    include.hostName !== false && !isPlaceholderText(summary.hostName) ? summary.hostName.trim() : null;

  const exactTexts: string[] = [];
  if (include.title !== false) exactTexts.push(invitationTitle);
  if (include.hostName !== false) exactTexts.push(celebrationLine);
  if (include.theme !== false && !isPlaceholderText(summary.theme) && summary.theme!.trim() !== invitationTitle) {
    exactTexts.push(summary.theme!.trim());
  }
  if (dateLine) exactTexts.push(`DATA: ${dateLine}`);
  if (timeLine) exactTexts.push(`HORÁRIO: ${timeLine}`);
  if (locationLine) exactTexts.push(`LOCAL: ${locationLine}${locationDetail ? ` — ${locationDetail}` : ""}`);
  if (organizerLine && organizerLine !== honoreeName) exactTexts.push(`Organizado por ${organizerLine}`);

  const palette = inferPaletteFromBrief(userBrief, preset?.palette ?? ["white", "soft pastel tones", "gold accents"]);
  const decorativeElements = inferElementsFromBrief(
    `${userBrief} ${invitationTitle}`,
    preset?.elements ?? ["soft decorative accents", "elegant borders", "subtle stars"]
  );

  return {
    eventType: summary.eventType,
    eventTypeLabel,
    invitationTitle,
    honoreeName,
    celebrationLine,
    dateLine,
    timeLine,
    locationLine,
    locationDetail,
    organizerLine,
    visualTheme: userBrief,
    colorPalette: palette,
    decorativeElements,
    aesthetic: preset?.aesthetic ?? "premium Brazilian party invitation, clean layout, Instagram Story format",
    typography: "elegant mix of script and sans-serif, highly readable Portuguese text, clear hierarchy",
    layoutDescription: `Vertical invitation ${options.size}, clear top-to-bottom hierarchy: decorative header title, central focal area${options.withHostPhoto ? " with real photo" : ""}, structured info blocks with icons for date/time/location, generous spacing, professional print-ready finish`,
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

  if (spec.withHostPhoto) {
    return `Create a premium vertical first-party invitation design in Brazilian Portuguese.

Theme / title: "${spec.invitationTitle}"
Event type: ${spec.eventTypeLabel}
Honoree: ${spec.honoreeName}

VISUAL DIRECTION FROM ORGANIZER:
${spec.visualTheme}

COLOR PALETTE (strict):
${spec.colorPalette.join(", ")}

DECORATIVE ELEMENTS:
${spec.decorativeElements.join(", ")}

PHOTO INTEGRATION (CRITICAL):
${spec.photoIntegration}

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
  }

  return `Create a premium vertical party invitation in Brazilian Portuguese.

Theme / title: "${spec.invitationTitle}"
Event type: ${spec.eventTypeLabel}

VISUAL DIRECTION:
${spec.visualTheme}

COLOR PALETTE:
${spec.colorPalette.join(", ")}

DECORATIVE ELEMENTS:
${spec.decorativeElements.join(", ")}

LAYOUT:
${spec.layoutDescription}

TYPOGRAPHY:
${spec.typography}

EXACT PORTUGUESE TEXT TO RENDER LEGIBLY:
${textBlock}

STYLE:
${spec.aesthetic}
luxury invitation design,
Instagram Story format,
clean and sophisticated,
soft lighting,
professional quality,
no watermarks,
no placeholder text,
no English text.`;
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

function buildBriefLocation(input: CoverFormEventInput) {
  if (input.eventFormat === "fundraising") return "Contribuição via Pix";
  if (input.eventFormat === "online") return input.onlineMeetingUrl?.trim() || "Evento online";
  const headline = [input.venueName?.trim(), input.city?.trim()].filter(Boolean).join(", ");
  const address = input.venueAddress?.trim();
  if (headline && address && address !== input.venueName?.trim()) return `${headline} — ${address}`;
  return headline || address || null;
}

export function buildCoverEventBriefLines(input: CoverFormEventInput) {
  const lines: Array<{ label: string; value: string }> = [];
  const typeLabel = EVENT_TYPE_LABELS[input.eventType as EventType] ?? "Evento especial";

  if (!isPlaceholderText(input.eventTitle)) {
    lines.push({ label: "Título do evento", value: input.eventTitle.trim() });
  }
  if (!isPlaceholderText(input.hostName)) {
    lines.push({ label: "Homenageado(a)", value: input.hostName.trim() });
  }
  if (!isPlaceholderText(input.theme) && input.theme!.trim() !== input.eventTitle?.trim()) {
    lines.push({ label: "Tema do convite", value: input.theme!.trim() });
  }

  lines.push({ label: "Tipo de evento", value: typeLabel });

  const dateLine = formatCoverDateLine(input.date);
  const timeLine = formatCoverTimeLine(input.startsAt, input.endsAt);
  if (dateLine) lines.push({ label: "Data", value: dateLine });
  if (timeLine) lines.push({ label: "Horário", value: timeLine });

  const location = buildBriefLocation(input);
  if (location) lines.push({ label: "Local", value: location });

  return lines;
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

  return [themePart, hint, `Formato ${COVER_IMAGE_FORMAT.aspectRatio} (${COVER_IMAGE_FORMAT.size}).`]
    .filter(Boolean)
    .join(" ");
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
    city: input.eventCity ?? "",
    onlineMeetingUrl: input.onlineMeetingUrl
  };
}
