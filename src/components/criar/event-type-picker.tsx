"use client";

import type { EventType } from "@/types/domain";
import { Icon, type IconName } from "@/components/app/ui/icon";
import { EVENT_TYPE_OPTIONS } from "@/lib/events/event-types";

const QUICK_EVENT_TYPES: { value: EventType; icon: IconName }[] = [
  { value: "aniversario", icon: "gift" },
  { value: "casamento", icon: "heart" },
  { value: "cha_fraldas", icon: "spark" },
  { value: "cha_revelacao", icon: "spark" },
  { value: "mesversario", icon: "gift" },
  { value: "festa_15_anos", icon: "spark" },
  { value: "formatura", icon: "check" },
  { value: "batizado", icon: "spark" },
  { value: "eventos_diversos", icon: "grid" },
  { value: "outros", icon: "plus" }
];

const LABELS = Object.fromEntries(EVENT_TYPE_OPTIONS.map((item) => [item.value, item.label])) as Record<EventType, string>;

export function EventTypeQuickPicker({ value, onChange }: { value: EventType; onChange: (value: EventType) => void }) {
  return (
    <div className="event-type-pills">
      {QUICK_EVENT_TYPES.map((item) => {
        const on = value === item.value;
        return (
          <button
            key={item.value}
            type="button"
            className={`event-type-pill${on ? " is-selected" : ""}`}
            onClick={() => onChange(item.value)}
          >
            <Icon name={item.icon} size={15} />
            {LABELS[item.value] ?? item.value}
          </button>
        );
      })}
    </div>
  );
}

export function EventTypeEmojiGrid({
  value,
  onChange,
  showAll,
  onToggleShowAll
}: {
  value: EventType | "";
  onChange: (value: EventType) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const visible = showAll ? EVENT_TYPE_OPTIONS : EVENT_TYPE_OPTIONS.filter((item) => item.popular || item.value === "outros");

  return (
    <>
      <div className="event-type-grid">
        {visible.map((type) => {
          const selected = value === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              className={`event-type-option${selected ? " is-selected" : ""}`}
            >
              {selected && <span className="event-type-check" aria-hidden>✓</span>}
              <span className="event-type-emoji">{type.emoji}</span>
              <span className="event-type-label">{type.label}</span>
            </button>
          );
        })}
      </div>
      <button type="button" className="btn secondary event-type-more-btn" onClick={onToggleShowAll}>
        {showAll ? "Ver menos ↑" : "Ver mais opções ↓"}
      </button>
    </>
  );
}
