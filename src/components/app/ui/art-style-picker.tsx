"use client";

import { Icon } from "@/components/app/ui/icon";
import { ART_STYLE_OPTIONS, artStyleHint, type ArtStyle } from "@/lib/openai/art-styles";

export function ArtStylePicker({ value, onChange }: { value: ArtStyle; onChange: (style: ArtStyle) => void }) {
  const selected = ART_STYLE_OPTIONS.find((opt) => opt.id === value) ?? ART_STYLE_OPTIONS[0];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        {ART_STYLE_OPTIONS.map((opt) => {
          const on = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={on}
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
      <div
        style={{
          marginTop: 10,
          padding: "11px 13px",
          borderRadius: 12,
          background: "var(--card-2)",
          border: "1px solid var(--line)"
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Icon name={selected.icon} size={16} style={{ color: "var(--coral)", flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink)" }}>{selected.label}</div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
              {artStyleHint(value)}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--faint)", lineHeight: 1.4 }}>
              Detalhe enviado ao prompt da arte — não altera a prévia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
