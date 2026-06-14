export const PRAESENTIA_BRAND = {
  cream: "#f6efe1",
  paper: "#fcfaf5",
  border: "#d8c7ad",
  coral: "#ef6351",
  tape: "#f4c869",
  tapeEdge: "#eab84e",
  letter: "#f7f0e2",
  ink: "#2a221b"
} as const;

export type PraesentiaMarkOptions = {
  tilt?: number;
  withTape?: boolean;
  withShadow?: boolean;
  frame?: string;
  border?: string;
  photo?: string;
  letter?: string;
  photoLine?: boolean;
  mono?: string | null;
};

export const PRAESENTIA_MARK_VIEWBOX = { width: 240, height: 280 } as const;

export function praesentiaTapePath(width: number, height: number) {
  const d = height * 0.26;
  const half = width / 2;
  const top = -height / 2;
  const bottom = height / 2;
  const step = height / 6;
  const left = -half;
  const right = half;

  return [
    `M ${left + d} ${top} L ${right - d} ${top}`,
    `L ${right} ${top + step} L ${right - d} ${top + 2 * step} L ${right} ${top + 3 * step} L ${right - d} ${top + 4 * step} L ${right} ${top + 5 * step} L ${right - d} ${bottom}`,
    `L ${left + d} ${bottom}`,
    `L ${left} ${top + 5 * step} L ${left + d} ${top + 4 * step} L ${left} ${top + 3 * step} L ${left + d} ${top + 2 * step} L ${left} ${top + step} L ${left + d} ${top} Z`
  ].join(" ");
}

export function resolvePraesentiaMarkGeometry() {
  const frameX = 58;
  const frameY = 50;
  const frameWidth = 124;
  const frameHeight = 168;
  const frameRadius = 5;
  const photoX = frameX + 12;
  const photoY = frameY + 14;
  const photoWidth = frameWidth - 24;
  const photoHeight = photoWidth;
  const letterX = photoX + photoWidth / 2;
  const letterY = photoY + photoHeight / 2 + 2;
  const rotateX = frameX + frameWidth / 2;
  const rotateY = frameY + frameHeight / 2;

  return {
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    frameRadius,
    photoX,
    photoY,
    photoWidth,
    photoHeight,
    letterX,
    letterY,
    rotateX,
    rotateY,
    letterSize: photoWidth * 0.74
  };
}

export function resolvePraesentiaMarkColors(options: PraesentiaMarkOptions = {}) {
  const mono = options.mono ?? null;

  if (mono) {
    return {
      frame: "none",
      border: mono,
      photo: mono,
      letter: options.frame ?? "#fff",
      tape: mono,
      tapeEdge: mono,
      showBorder: true,
      mono: true
    };
  }

  return {
    frame: options.frame ?? PRAESENTIA_BRAND.paper,
    border: options.border ?? PRAESENTIA_BRAND.border,
    photo: options.photo ?? PRAESENTIA_BRAND.coral,
    letter: options.letter ?? PRAESENTIA_BRAND.letter,
    tape: PRAESENTIA_BRAND.tape,
    tapeEdge: PRAESENTIA_BRAND.tapeEdge,
    showBorder: true,
    mono: false as const,
    photoLine: options.photoLine ?? false
  };
}
