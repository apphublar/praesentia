export type PhotoSize = "sm" | "md" | "lg" | "xl";

export type PhotoShape = "original" | "round" | "square";

export type PhotoOverlayConfig = {
  color?: string;
  imageUrl?: string;
  shape: PhotoShape;
  pos: string;
  size?: PhotoSize;
  removeBackground?: boolean;
  /** Orientação livre do organizador sobre a foto (quem manter, o que remover, etc.). */
  notes?: string;
};

const POS_LABEL: Record<string, string> = {
  tl: "top-left corner (upper left)",
  tc: "top center",
  tr: "top-right corner (upper right)",
  ml: "middle left",
  mc: "center of the image",
  mr: "middle right",
  bl: "bottom-left corner (lower left)",
  bc: "bottom center",
  br: "bottom-right corner (lower right)"
};

const SIZE_LABEL: Record<PhotoSize, string> = {
  sm: "about 22% of image width",
  md: "about 29% of image width",
  lg: "about 36% of image width",
  xl: "about 44% of image width"
};

const SHAPE_LABEL: Record<PhotoShape, string> = {
  original: "natural photo rectangle (original aspect ratio as uploaded)",
  round: "circular",
  square: "rounded square"
};

export function photoSizePercent(size: PhotoSize = "md") {
  const map = { sm: 0.22, md: 0.29, lg: 0.36, xl: 0.44 } as const;
  return map[size];
}

/** Instruções para a IA integrar a arte com a foto real (sem gerar rostos). */
export function buildPhotoZoneInstructions(photo: PhotoOverlayConfig) {
  const pos = POS_LABEL[photo.pos] ?? photo.pos;
  const size = SIZE_LABEL[photo.size ?? "md"];
  const shape = SHAPE_LABEL[photo.shape];
  const bgNote = photo.removeBackground
    ? "The app will cut out the selected people from their uploaded photo (remove the photo background) and place them onto the invitation artwork — the invitation design/background is never altered."
    : "The app will place the real uploaded photo of the honoree with its original background.";

  const notes = photo.notes?.trim();
  const notesBlock = notes
    ? [
        "",
        "ORGANIZER PHOTO NOTES (follow EXACTLY — in addition to the settings above):",
        notes,
        "Honor these notes when designing the photo zone and when the app overlays the real photo (who to keep, who to exclude, replacements, or special treatment)."
      ]
    : [];

  return [
    "CRITICAL — EXTERNAL PHOTO COMPOSITION:",
    "Do NOT generate, draw, paint, or include ANY person, face, portrait, human figure, or photo frame anywhere in the artwork.",
    "The real honoree photo is added by the app AFTER generation — never by the AI.",
    `Honoree photo placement: ${shape} zone in the ${pos}, ${size}.`,
    bgNote,
    "",
    "LAYERED INTERACTION WITH HONOREE (mandatory):",
    "Design the invitation so typography and themed elements interact naturally with where the honoree will appear — like a professional party poster.",
    "You MAY place titles, ribbons, confetti, streamers, balls, flowers, borders, and themed props overlapping the photo zone — especially shoulders, arms, sides, and lower body — for depth and integration.",
    "Some elements should appear to pass in front of the body; others frame the person from behind or the sides.",
    "NEVER cover the face: keep the upper-center face oval of the photo zone completely clear — no text, logos, or heavy objects over the face.",
    "Fill the photo zone with rich themed decoration (not a blank void) so the app can layer the real photo with artwork crossing the body while the face stays visible.",
    "Event details (date, time, location) stay in the bottom panel; large headline/title typography from the visual direction may sit in the upper or middle area and may touch the photo zone edges.",
    ...notesBlock
  ].join("\n");
}
