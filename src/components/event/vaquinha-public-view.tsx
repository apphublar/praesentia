"use client";

import { useState } from "react";

export function VaquinhaPublicView({
  title,
  hostName,
  story,
  goalAmount,
  pixKey,
  pixReceiverName,
  pixMessage,
  deadlineLabel,
  eventLink
}: {
  title: string;
  hostName: string;
  story?: string;
  goalAmount?: number;
  pixKey?: string;
  pixReceiverName?: string;
  pixMessage?: string;
  deadlineLabel?: string;
  eventLink: string;
}) {
  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  async function copyPix() {
    if (!pixKey) return;
    await navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(eventLink);
    setCopiedLink(true);
  }

  const waText = encodeURIComponent(
    `${title}\n\n${story?.slice(0, 200) ?? ""}\n\nContribua via Pix: ${eventLink}`
  );

  return (
    <section className="vaquinha-public">
      <span className="pill" style={{ background: "var(--green)", color: "#fff" }}>vaquinha · Pix</span>
      <h1 className="display-i" style={{ fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.98, margin: "12px 0 8px" }}>
        {title}
      </h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: 20 }}>
        Organizado por <strong>{hostName}</strong>
        {deadlineLabel ? <> · prazo: {deadlineLabel}</> : null}
      </p>

      {goalAmount ? (
        <article className="card vaquinha-goal-card">
          <div className="mono" style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)" }}>
            meta da arrecadação
          </div>
          <div className="display" style={{ fontSize: 42, marginTop: 8 }}>
            R$ {goalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: "8px 0 0" }}>
            Contribuições são feitas diretamente via Pix para o organizador. A Praesentia não intermedia valores.
          </p>
        </article>
      ) : null}

      {story && (
        <article className="card" style={{ padding: 22, marginTop: 18 }}>
          <h2 className="display" style={{ fontSize: 24, marginTop: 0 }}>História</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{story}</p>
        </article>
      )}

      {pixKey && (
        <article className="card" style={{ padding: 22, marginTop: 18, background: "var(--bg-soft)" }}>
          <h2 className="display" style={{ fontSize: 24, marginTop: 0 }}>Contribuir via Pix</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Recebedor: <strong>{pixReceiverName ?? hostName}</strong>
          </p>
          {pixMessage && <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>{pixMessage}</p>}
          <code style={{ display: "block", background: "#fff", padding: "12px 14px", borderRadius: 12, wordBreak: "break-all", marginTop: 12 }}>
            {pixKey}
          </code>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" className="btn" onClick={copyPix}>
              {copiedPix ? "Chave copiada!" : "Copiar chave Pix"}
            </button>
            <button type="button" className="btn secondary" onClick={copyLink}>
              {copiedLink ? "Link copiado!" : "Copiar link da vaquinha"}
            </button>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}
            >
              Compartilhar vaquinha
            </a>
          </div>
        </article>
      )}
    </section>
  );
}
