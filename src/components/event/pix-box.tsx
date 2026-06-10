"use client";

import { useState } from "react";
import type { PixSettings } from "@/types/domain";

export function PixBox({ pix }: { pix?: PixSettings }) {
  const [copied, setCopied] = useState(false);

  if (!pix?.enabled || !pix.key) return null;

  async function copyPix() {
    await navigator.clipboard.writeText(pix!.key);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="public-pix-box">
      <div className="public-pix-field">
        <span>Recebedor</span>
        <strong>{pix.receiverName}</strong>
      </div>
      <div className="public-pix-field">
        <span>Chave Pix</span>
        <code>{pix.key}</code>
      </div>
      {pix.suggestedAmount ? (
        <p className="public-event-message">Valor sugerido: R$ {pix.suggestedAmount.toLocaleString("pt-BR")}</p>
      ) : (
        <p className="public-event-message">Envie o valor que desejar.</p>
      )}
      {pix.message ? <p className="public-event-message">{pix.message}</p> : null}
      <button type="button" className="btn public-pix-copy" onClick={copyPix}>
        {copied ? "Chave copiada!" : "Copiar chave Pix"}
      </button>
    </div>
  );
}
