"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/app/ui/icon";
import type { PlanId } from "@/components/app/plans/plan-cards";

export function CreateEventPronto({
  eventSlug,
  eventId,
  plan
}: {
  eventSlug: string;
  eventId: string;
  plan: PlanId;
}) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://www.praesentia.com.br";
  const link = `${appUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}/evento/${eventSlug}`.replace(/^/, appUrl.includes("localhost") ? "" : "");
  const fullLink = `${appUrl}/evento/${eventSlug}`;
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Você está convidado! Confirme aqui: ${fullLink}`)}`;

  return (
    <div style={{ textAlign: "center", paddingTop: 8 }}>
      <div
        className="pop"
        style={{
          width: 64,
          height: 64,
          borderRadius: 99,
          background: "var(--coral)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          boxShadow: "0 12px 30px -10px rgba(242,107,90,.6)"
        }}
      >
        <Icon name="check" size={30} sw={2.6} style={{ color: "#fff" }} />
      </div>
      <h1 className="display" style={{ fontSize: 40, marginBottom: 8 }}>
        Seu evento está <span className="coral">no ar</span>.
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 15, margin: "0 0 28px" }}>
        Um único link acompanha tudo — do convite {plan !== "free" ? "à cápsula do tempo" : "até o fim da festa"}.
      </p>
      <div style={{ display: "flex", gap: 24, maxWidth: 540, margin: "0 auto", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <div
          style={{
            width: 130,
            height: 130,
            flexShrink: 0,
            borderRadius: 16,
            background: "#fff",
            border: "1px solid var(--line)",
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gridTemplateRows: "repeat(7,1fr)",
            gap: 2,
            padding: 14
          }}
        >
          {Array.from({ length: 49 }).map((_, i) => (
            <span
              key={i}
              style={{
                borderRadius: 1,
                background: [0, 1, 5, 6, 7, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 28, 34, 35, 40, 42, 48, 47, 43, 29, 36].includes(i)
                  ? "var(--ink)"
                  : "transparent"
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 240, textAlign: "left" }}>
          <div className="card-flat" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff", marginBottom: 12 }}>
            <Icon name="link" size={16} style={{ color: "var(--muted)" }} />
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-mono)", wordBreak: "break-all" }}>{fullLink.replace(/^https?:\/\//, "")}</span>
            <button type="button" className="btn btn-dark btn-sm" onClick={copyLink}>
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <a className="btn btn-coral btn-sm" style={{ flex: 1 }} href={whatsapp} target="_blank" rel="noopener noreferrer">
              <Icon name="share" size={15} />
              WhatsApp
            </a>
            <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={copyLink}>
              <Icon name="qr" size={15} />
              QR Code
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
        <Link className="btn btn-ghost" href={`/evento/${eventSlug}`} target="_blank">
          <Icon name="eye" size={16} />
          Ver como convidado
        </Link>
        <Link className="btn btn-dark" href={`/dashboard/eventos/${eventId}`}>
          Ir para o painel
          <Icon name="arrowR" size={15} />
        </Link>
      </div>
    </div>
  );
}
