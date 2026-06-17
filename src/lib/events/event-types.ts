import type { EventType } from "@/types/domain";

export type EventTypeOption = {
  value: EventType;
  label: string;
  emoji: string;
  popular?: boolean;
};

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { value: "aniversario", label: "Festa de Aniversário", emoji: "🎂", popular: true },
  { value: "mesversario", label: "Mesversário", emoji: "🎈", popular: true },
  { value: "festa_infantil", label: "Festa Infantil", emoji: "🎈", popular: true },
  { value: "cha_fraldas", label: "Chá de Fraldas / Bebê", emoji: "👶", popular: true },
  { value: "cha_revelacao", label: "Chá Revelação", emoji: "🎁", popular: true },
  { value: "casamento", label: "Casamento", emoji: "💍", popular: true },
  { value: "festa_15_anos", label: "Festa de 15 anos", emoji: "👑", popular: true },
  { value: "formatura", label: "Festa de Formatura", emoji: "🎓", popular: true },
  { value: "vaquinha", label: "Vaquinha", emoji: "🐄", popular: true },
  { value: "batizado", label: "Batizado Cristão", emoji: "🕊️" },
  { value: "cha_casa_nova", label: "Chá de Casa Nova", emoji: "🏠" },
  { value: "cha_pet", label: "Chá de Pet", emoji: "🐾" },
  { value: "natal", label: "Festa de Natal", emoji: "🎄" },
  { value: "corporativo", label: "Corporativo", emoji: "🏢" },
  { value: "eventos_diversos", label: "Eventos Diversos", emoji: "🎉" },
  { value: "outros", label: "Outros", emoji: "✨" }
];

export const EVENT_TYPE_VALUES = EVENT_TYPE_OPTIONS.map((item) => item.value);

export const EVENT_TYPE_LABELS: Record<EventType, string> = Object.fromEntries(
  EVENT_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<EventType, string>;

export function normalizeEventType(value: string | null | undefined): EventType {
  if (value && EVENT_TYPE_VALUES.includes(value as EventType)) {
    return value as EventType;
  }
  return "outros";
}
