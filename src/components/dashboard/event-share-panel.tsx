"use client";

import { useState } from "react";

export function EventSharePanel({
  eventSlug,
  eventTitle,
  coverUrl,
  whatsappText,
  headline,
  message
}: {
  eventSlug: string;
  eventTitle: string;
  coverUrl?: string;
  whatsappText?: string;
  headline?: string;
  message?: string;
}) {
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventLink = `${appUrl}/evento/${eventSlug}`;
  const waBody = whatsappText?.includes("{{link}}")
    ? whatsappText.replace(/\{\{link\}\}/g, eventLink)
    : whatsappText
      ? `${whatsappText} ${eventLink}`
      : `${headline ? `${headline}\n\n` : ""}${message ? `${message}\n\n` : ""}${eventLink}`;

  async function copyAll() {
    await navigator.clipboard.writeText(waBody);
    setCopied(true);
  }

  return (
    <article className="card dashboard-card">
      <span className="pill">compartilhar</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>Envie para seus convidados</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14 }}>
        Link público: <code style={{ wordBreak: "break-all" }}>{eventLink}</code>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {coverUrl && (
          <a href={coverUrl} download={`${eventSlug}-convite.png`} className="btn secondary" style={{ textAlign: "center" }}>
            Baixar imagem do convite
          </a>
        )}
        <button type="button" className="btn secondary" onClick={copyAll}>
          {copied ? "Texto e link copiados!" : "Copiar texto + link"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(waBody)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ background: "#25D366", color: "#fff", textAlign: "center", textDecoration: "none" }}
        >
          Enviar no WhatsApp
        </a>
      </div>
    </article>
  );
}
