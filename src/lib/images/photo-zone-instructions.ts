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
  round: "circular crop",
  square: "rounded square crop"
};

export function photoSizePercent(size: PhotoSize = "md") {
  const map = { sm: 0.22, md: 0.29, lg: 0.36, xl: 0.44 } as const;
  return map[size];
}

/** Instruções para a IA usar a foto enviada e criar o convite integrado numa única geração. */
export function buildPhotoZoneInstructions(photo: PhotoOverlayConfig) {
  const pos = POS_LABEL[photo.pos] ?? photo.pos;
  const size = SIZE_LABEL[photo.size ?? "md"];
  const shape = SHAPE_LABEL[photo.shape];

  const bgNote = photo.removeBackground
    ? "REMOVE the background from the uploaded reference photo completely. Keep only the honoree person(s) with clean edges — no white box, no studio backdrop, no original photo background visible."
    : "Keep the honoree from the uploaded reference photo; you may retain a soft natural background from the original if it blends with the invitation.";

  const notes = photo.notes?.trim();
  const notesBlock = notes
    ? [
        "",
        "ORGANIZER PHOTO NOTES (follow EXACTLY):",
        notes,
        "Apply these notes to who to keep, exclude, or adjust in the reference photo."
      ]
    : [];

  return [
    "REFERENCE PHOTO — CRITICAL (follow EXACTLY):",
    "The uploaded image is the REAL honoree photo. Use this exact person — preserve their face, identity, expression, and pose.",
    "Create the full vertical invitation artwork AROUND and WITH this person integrated into the design — like a professional party poster made in one composition.",
    "Do NOT replace the person with a different face or a generic illustrated character.",
    `Place the honoree: ${shape}, ${pos}, ${size} of the invitation area.`,
    bgNote,
    "",
    "INTEGRATION (mandatory):",
    "Themed decorations, ribbons, confetti, flowers, and typography may overlap shoulders, arms, and sides for depth.",
    "Some elements may pass in front of the body; others frame the person naturally.",
    "NEVER cover the face: keep the upper-center face area clear — no text or heavy objects over the face.",
    "Event details (date, time, location) stay in the bottom panel only.",
    "Do NOT paste a flat rectangular photo card on top of the design — blend the person into the scene.",
    ...notesBlock
  ].join("\n");
}
