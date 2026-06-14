"use client";

import { Icon } from "@/components/app/ui/icon";
import { ART_STYLE_OPTIONS, type ArtStyle } from "@/lib/openai/art-styles";

export function ArtStylePicker({ value, onChange }: { value: ArtStyle; onChange: (style: ArtStyle) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
      {ART_STYLE_OPTIONS.map((opt) => {
        const on = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            title={opt.hint}
            onClick={() => onChange(opt.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 6px",
              borderRadius: 12,
              cursor: "pointer",
              background: on ? "var(--ink)" : "#fff",
              border: `1.5px solid ${on ? "var(--ink)" : "var(--line-2)"}`,
              color: on ? "#fff" : "var(--ink)",
              transition: "all .12s",
              minWidth: 0
            }}
          >
            <Icon name={opt.icon} size={17} style={{ color: on ? "var(--coral)" : "var(--ink-2)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, textAlign: "center" }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
