"use client";

import { useState } from "react";
import { IconLink, IconShare } from "@/components/dashboard/dashboard-icons";
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
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.praesentia.com.br";
  const eventLink = `${appUrl}/evento/${eventSlug}`;
  const waBody = previewWhatsappMessage(whatsappText, eventLink);

  async function copyLink() {
    await navigator.clipboard.writeText(eventLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="dashboard-quick-actions">
      <button type="button" className="dashboard-quick-btn" onClick={copyLink}>
        <IconLink />
        {copied ? "Link copiado!" : "Copiar link"}
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
  );
}
