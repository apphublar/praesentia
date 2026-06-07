"use client";

import { useState } from "react";
import type { MediaItem } from "@/types/domain";

export function OwnerMediaControls({ items }: { items: MediaItem[] }) {
  const [rows, setRows] = useState(items);

  async function patchItem(mediaId: string, action: "archive" | "hide_from_screen" | "show_on_screen") {
    const item = rows.find((row) => row.id === mediaId);
    if (!item) return;

    const response = await fetch(`/api/events/${item.eventId}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!response.ok) return;

    const data = (await response.json()) as { item: MediaItem };
    setRows((current) => current.map((row) => (row.id === mediaId ? data.item : row)));
  }

  async function deleteItem(item: MediaItem) {
    const response = await fetch(`/api/events/${item.eventId}/media/${item.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setRows((current) => current.filter((row) => row.id !== item.id));
  }

  return (
    <section className="card" style={{ padding: 22, marginTop: 24 }}>
      <h2 className="display" style={{ marginTop: 0, fontSize: 30 }}>Conteúdos compartilhados</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.55 }}>
        Use controles rapidos durante a festa: ocultar do telão, arquivar da cápsula ou excluir definitivamente.
      </p>
      <div className="grid">
        {rows.map((item) => (
          <article
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 14,
              alignItems: "center",
              borderTop: "1px solid var(--line)",
              paddingTop: 14
            }}
          >
            <div>
              <strong>{item.authorName}</strong>
              <div style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 4 }}>
                {item.type} - {item.status} - {item.visibleOnScreen ? "aparece no telão" : "oculto do telão"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button className="btn secondary" onClick={() => patchItem(item.id, "archive")}>
                Arquivar
              </button>
              <button
                className="btn secondary"
                onClick={() => patchItem(item.id, item.visibleOnScreen ? "hide_from_screen" : "show_on_screen")}
              >
                {item.visibleOnScreen ? "Ocultar telão" : "Mostrar telão"}
              </button>
              <button className="btn secondary" onClick={() => deleteItem(item)}>
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
