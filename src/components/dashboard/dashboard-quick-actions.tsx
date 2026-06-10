"use client";

import { useState } from "react";
import { IconLink, IconQr, IconShare } from "@/components/dashboard/dashboard-icons";
import { previewWhatsappMessage } from "@/lib/events/invite-copy";

export function DashboardQuickActions({
  eventSlug,
  eventTitle,
  whatsappText
}: {
  eventSlug: string;
  eventTitle: string;
  whatsappText?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.praesentia.com.br";
  const eventLink = `${appUrl}/evento/${eventSlug}`;
  const waBody = previewWhatsappMessage(whatsappText, eventLink);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(eventLink)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(eventLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div className="dashboard-quick-actions">
        <button type="button" className="dashboard-quick-btn" onClick={copyLink}>
          <IconLink />
          {copied ? "Link copiado!" : "Copiar link"}
        </button>
        <button type="button" className="dashboard-quick-btn" onClick={() => setQrOpen(true)}>
          <IconQr />
          Criar QR Code
        </button>
        <a
          className="dashboard-quick-btn"
          href={`https://wa.me/?text=${encodeURIComponent(waBody)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconShare />
          Compartilhar
        </a>
      </div>

      {qrOpen ? (
        <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="QR Code do evento">
          <div className="dashboard-modal-card">
            <h3 className="display" style={{ fontSize: 24, margin: "0 0 8px" }}>
              QR Code do evento
            </h3>
            <p style={{ color: "var(--ink-soft)", margin: "0 0 16px", lineHeight: 1.5 }}>
              Escaneie ou baixe para colocar no convite físico ou telão.
            </p>
            <img src={qrUrl} alt={`QR Code para ${eventTitle}`} width={220} height={220} style={{ borderRadius: 12, border: "1px solid var(--line)" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <a className="btn secondary" href={qrUrl} download={`${eventSlug}-qr.png`}>
                Baixar QR Code
              </a>
              <button type="button" className="btn secondary" onClick={() => setQrOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
