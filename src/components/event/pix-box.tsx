"use client";

import { useState } from "react";
import type { PixSettings } from "@/types/domain";

export function PixBox({
  pix,
  fundraising = false
}: {
  pix?: PixSettings;
  fundraising?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (!pix?.enabled || !pix.key) return null;

  const goalAmount = pix.goalAmount ?? pix.suggestedAmount;
  const minPerPerson = pix.minPerPerson;

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
      {fundraising && goalAmount ? (
        <p className="public-event-message">
          Valor total a arrecadar: <strong>R$ {goalAmount.toLocaleString("pt-BR")}</strong>
        </p>
      ) : null}
      {fundraising && minPerPerson ? (
        <p className="public-event-message">
          Contribuição mínima sugerida por pessoa: <strong>R$ {minPerPerson.toLocaleString("pt-BR")}</strong>
        </p>
      ) : null}
      {!fundraising && pix.suggestedAmount ? (
        <p className="public-event-message">Valor sugerido: R$ {pix.suggestedAmount.toLocaleString("pt-BR")}</p>
      ) : !fundraising ? (
        <p className="public-event-message">Envie o valor que desejar.</p>
      ) : null}
      {pix.message ? <p className="public-event-message">{pix.message}</p> : null}
      <button type="button" className="btn public-pix-copy" onClick={copyPix}>
        {copied ? "Chave copiada!" : "Copiar chave Pix"}
      </button>
    </div>
  );
}
