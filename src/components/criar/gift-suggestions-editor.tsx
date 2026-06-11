"use client";

import { useState } from "react";
import type { GiftSuggestion } from "@/types/domain";

function createGiftId() {
  return `gift_${Math.random().toString(36).slice(2, 10)}`;
}

export function GiftSuggestionsEditor() {
  const [items, setItems] = useState<GiftSuggestion[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  function addItem() {
    const trimmed = title.trim();
    if (!trimmed) return;
    setItems((current) => [
      ...current,
      {
        id: createGiftId(),
        title: trimmed,
        note: note.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined
      }
    ]);
    setTitle("");
    setNote("");
    setLinkUrl("");
    setImageUrl("");
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="card create-form-section">
      <div className="create-form-kicker">sugestões de presente (opcional)</div>
      <p className="create-form-help">
        Compartilhe ideias de presente com os convidados: tamanhos, links de loja ou observações.
      </p>
      <input type="hidden" name="giftSuggestionsJson" value={JSON.stringify(items)} />
      {items.length ? (
        <ul className="gift-suggestions-list">
          {items.map((item) => (
            <li key={item.id} className="gift-suggestions-item">
              <div>
                <strong>{item.title}</strong>
                {item.note ? <p>{item.note}</p> : null}
              </div>
              <button type="button" className="btn secondary" onClick={() => removeItem(item.id)}>
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="create-form-fields">
        <label className="field">
          <span>Título da sugestão</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Ex: Roupinhas 6-9 meses" />
        </label>
        <label className="field">
          <span>Observação</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder="Detalhes, tamanhos, cores..." />
        </label>
        <label className="field">
          <span>Link (opcional)</span>
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} maxLength={300} placeholder="https://..." />
        </label>
        <label className="field">
          <span>URL da imagem (opcional)</span>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={500} placeholder="https://..." />
        </label>
        <button type="button" className="btn secondary" onClick={addItem} disabled={!title.trim()}>
          + Adicionar sugestão
        </button>
      </div>
    </div>
  );
}
