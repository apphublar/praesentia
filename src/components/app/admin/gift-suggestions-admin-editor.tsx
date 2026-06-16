"use client";

import { useState } from "react";
import type { GiftSuggestion } from "@/types/domain";
import { createGiftSuggestionId } from "@/lib/events/gift-suggestions";
import { Field2 } from "@/components/app/admin/conf-block";

export function GiftSuggestionsAdminEditor({
  initialItems,
  onSave,
  saving,
  message,
  tone
}: {
  initialItems: GiftSuggestion[];
  onSave: (items: GiftSuggestion[]) => Promise<void>;
  saving: boolean;
  message: string;
  tone: "ok" | "error" | "idle";
}) {
  const [items, setItems] = useState<GiftSuggestion[]>(initialItems);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function addItem() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setItems((current) => [
      ...current,
      {
        id: createGiftSuggestionId(),
        title: trimmed,
        note: note.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined
      }
    ]);
    setTitle("");
    setNote("");
    setLinkUrl("");
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.length ? (
        <ul className="gift-suggestions-list">
          {items.map((item) => (
            <li key={item.id} className="gift-suggestions-item">
              <div>
                <strong>{item.title}</strong>
                {item.note ? <p>{item.note}</p> : null}
                {item.linkUrl ? (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)", wordBreak: "break-all" }}>{item.linkUrl}</p>
                ) : null}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
          Nenhuma sugestão ainda. Adicione ideias de presente para os convidados verem no convite.
        </p>
      )}

      <Field2 label="Nome do presente">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex: Kit berço, Livro de histórias…" />
      </Field2>
      <Field2 label="Descrição">
        <textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Detalhes, tamanho, cor, observações…" />
      </Field2>
      <Field2 label="Link (opcional)">
        <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={400} placeholder="https://loja.com/produto…" />
      </Field2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={addItem} disabled={!title.trim()}>
          + Adicionar sugestão
        </button>
        <button type="button" className="btn btn-dark btn-sm" disabled={saving} onClick={() => onSave(items)}>
          {saving ? "Salvando…" : "Salvar sugestões"}
        </button>
      </div>

      {message ? (
        <p style={{ margin: 0, fontSize: 13, color: tone === "error" ? "var(--coral-deep)" : "#7d9a6f" }}>{message}</p>
      ) : null}
    </div>
  );
}
