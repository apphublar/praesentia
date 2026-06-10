import type { EventType } from "@/types/domain";

export type PublicEventTheme = {
  className: string;
  emoji: string;
  label: string;
};

const TYPE_THEMES: Partial<Record<EventType, PublicEventTheme>> = {
  festa_infantil: { className: "public-event-theme-infantil", emoji: "🎈", label: "Festa Infantil" },
  aniversario: { className: "public-event-theme-festa", emoji: "🎂", label: "Festa de Aniversário" },
  cha_fraldas: { className: "public-event-theme-bebe", emoji: "👶", label: "Chá de Fraldas" },
  cha_revelacao: { className: "public-event-theme-bebe", emoji: "🎁", label: "Chá Revelação" },
  casamento: { className: "public-event-theme-casamento", emoji: "💍", label: "Casamento" },
  festa_15_anos: { className: "public-event-theme-debut", emoji: "👑", label: "Festa de 15 anos" },
  formatura: { className: "public-event-theme-formatura", emoji: "🎓", label: "Formatura" },
  vaquinha: { className: "public-event-theme-vaquinha", emoji: "💚", label: "Vaquinha" },
  batizado: { className: "public-event-theme-classico", emoji: "🕊️", label: "Batizado" },
  cha_casa_nova: { className: "public-event-theme-casa", emoji: "🏠", label: "Chá de Casa Nova" },
  natal: { className: "public-event-theme-natal", emoji: "🎄", label: "Natal" },
  corporativo: { className: "public-event-theme-classico", emoji: "🏢", label: "Corporativo" },
  eventos_diversos: { className: "public-event-theme-festa", emoji: "🎉", label: "Evento" },
  outros: { className: "public-event-theme-festa", emoji: "✨", label: "Evento" }
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function resolvePublicEventTheme(theme: string, eventType: EventType): PublicEventTheme {
  const base = TYPE_THEMES[eventType] ?? TYPE_THEMES.outros!;
  const text = normalize(theme);

  if (text.includes("jardim") || text.includes("botan") || text.includes("flor")) {
    return { ...base, className: "public-event-theme-jardim", emoji: "🌿" };
  }
  if (text.includes("minimal")) {
    return { ...base, className: "public-event-theme-minimal", emoji: base.emoji };
  }
  if (text.includes("neon") || text.includes("festa")) {
    return { ...base, className: "public-event-theme-festa", emoji: "🎉" };
  }
  if (text.includes("bebe") || text.includes("infantil")) {
    return { ...base, className: "public-event-theme-infantil", emoji: "🎈" };
  }

  return base;
}
