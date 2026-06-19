export const ALBUM_MIN_PAGES = 20;
export const ALBUM_MAX_PAGES = 120;
export const ALBUM_PRICE_PER_PAGE_CENTS = 850;

export type AlbumLayoutId = "single" | "double" | "triple" | "quad" | "highlight" | "memory";

export type AlbumCoverColor = "beige" | "offwhite" | "sage" | "serenity" | "terracotta" | "black";
export type AlbumCoverStyle = "minimal" | "modern" | "elegant" | "playful" | "luxury";

export type AlbumPhotoSlot = {
  mediaId: string;
  caption?: string;
  dateLabel?: string;
  location?: string;
  note?: string;
};

export type AlbumMemoryBlock = {
  text: string;
  font: "serif" | "sans";
};

export type AlbumPage = {
  id: string;
  layout: AlbumLayoutId;
  chapter?: string;
  slots: AlbumPhotoSlot[];
  memory?: AlbumMemoryBlock;
};

export type AlbumCover = {
  title: string;
  color: AlbumCoverColor;
  style: AlbumCoverStyle;
  coverMediaId?: string;
};

export type AlbumWizardStep = "select" | "editor" | "cover" | "review";

export type PhotoAlbumDraft = {
  version: 1;
  step: AlbumWizardStep;
  selectedPhotoIds: string[];
  favoritePhotoIds: string[];
  pages: AlbumPage[];
  cover: AlbumCover;
  status: "draft" | "submitted" | "paid";
  submittedAt?: string;
  orderId?: string;
};

export const ALBUM_LAYOUT_SLOTS: Record<AlbumLayoutId, number> = {
  single: 1,
  double: 2,
  triple: 3,
  quad: 4,
  highlight: 3,
  memory: 1
};

export const ALBUM_LAYOUT_LABELS: Record<AlbumLayoutId, string> = {
  single: "1 foto grande",
  double: "2 fotos médias",
  triple: "3 fotos",
  quad: "4 fotos pequenas",
  highlight: "Destaque + 2 secundárias",
  memory: "Polaroid + recado"
};

export const ALBUM_COVER_COLORS: { id: AlbumCoverColor; label: string; swatch: string }[] = [
  { id: "beige", label: "Bege", swatch: "#e8dfd0" },
  { id: "offwhite", label: "Off White", swatch: "#f7f3eb" },
  { id: "sage", label: "Verde Sage", swatch: "#b8c4b0" },
  { id: "serenity", label: "Azul Serenity", swatch: "#a8b8c8" },
  { id: "terracotta", label: "Terracota", swatch: "#c67d5a" },
  { id: "black", label: "Preto Premium", swatch: "#1f1a16" }
];

export const ALBUM_COVER_STYLES: { id: AlbumCoverStyle; label: string }[] = [
  { id: "minimal", label: "Minimalista" },
  { id: "modern", label: "Moderno" },
  { id: "elegant", label: "Elegante" },
  { id: "playful", label: "Infantil" },
  { id: "luxury", label: "Luxo" }
];

export const MEMORY_TIMELINE_CHAPTERS = [
  "O Começo",
  "Descobrindo o Mundo",
  "Primeiras Risadas",
  "Momentos Inesquecíveis",
  "Nossa História Continua"
] as const;
