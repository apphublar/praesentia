import type { IconName } from "@/components/app/ui/icon";

export const ART_STYLE_OPTIONS = [
  {
    id: "Elegante",
    label: "Elegante",
    icon: "spark" as IconName,
    hint: "Dourado, serifas refinadas, iluminação suave",
    prompt: "estilo elegante com dourado, serifas refinadas e iluminação suave",
    preview: { t: "#f3ead8", a: "#b8923a" }
  },
  {
    id: "Aquarela",
    label: "Aquarela",
    icon: "image" as IconName,
    hint: "Pinceladas suaves, flores pintadas",
    prompt: "estilo aquarela com pinceladas suaves e flores pintadas",
    preview: { t: "#dce9f2", a: "#5f7d9a" }
  },
  {
    id: "Botânico",
    label: "Botânico",
    icon: "leaf" as IconName,
    hint: "Folhagens, flores, tons naturais",
    prompt: "estilo botânico com folhagens, flores e tons naturais",
    preview: { t: "var(--p-green)", a: "#7d9a6f" }
  },
  {
    id: "Festivo",
    label: "Festivo",
    icon: "gift" as IconName,
    hint: "Cores vibrantes, confetes, energia",
    prompt: "estilo festivo com cores vibrantes, confetes e energia",
    preview: { t: "#fde8d8", a: "#e07a4a" }
  },
  {
    id: "Premium",
    label: "Premium",
    icon: "crown" as IconName,
    hint: "Acabamento sofisticado, luxo",
    prompt: "estilo premium com acabamento sofisticado e luxo",
    preview: { t: "#1c1814", a: "#c9a962" }
  },
  {
    id: "Lúdico",
    label: "Lúdico",
    icon: "balloon" as IconName,
    hint: "Ilustrações divertidas, infantil",
    prompt: "estilo lúdico com ilustrações divertidas e clima infantil",
    preview: { t: "#fff0d6", a: "#e8a030" }
  },
  {
    id: "Neon",
    label: "Neon",
    icon: "moon" as IconName,
    hint: "Brilho, luzes, festa noturna",
    prompt: "estilo neon com brilho, luzes e clima de festa noturna",
    preview: { t: "#120f24", a: "#7b5cff" }
  },
  {
    id: "Vintage",
    label: "Vintage",
    icon: "hourglass" as IconName,
    hint: "Papel envelhecido, ornamentos clássicos",
    prompt: "estilo vintage com papel envelhecido e ornamentos clássicos",
    preview: { t: "#ede4d0", a: "#8a6f52" }
  }
] as const;

export type ArtStyle = (typeof ART_STYLE_OPTIONS)[number]["id"];

export const ART_STYLE_MAP = Object.fromEntries(
  ART_STYLE_OPTIONS.map((opt) => [opt.id, { t: opt.preview.t, a: opt.preview.a }])
) as Record<ArtStyle, { t: string; a: string }>;

export function artStyleTheme(style: ArtStyle) {
  return ART_STYLE_MAP[style] ?? ART_STYLE_MAP.Elegante;
}

export function artStylePrompt(style: ArtStyle) {
  return ART_STYLE_OPTIONS.find((opt) => opt.id === style)?.prompt ?? ART_STYLE_OPTIONS[0].prompt;
}

export function artStyleHint(style: ArtStyle) {
  return ART_STYLE_OPTIONS.find((opt) => opt.id === style)?.hint ?? ART_STYLE_OPTIONS[0].hint;
}
