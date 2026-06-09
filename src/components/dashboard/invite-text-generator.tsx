"use client";

import { useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";

type TextQuota = {
  maxGenerations: number;
  maxEdits: number;
  remainingGenerations: number;
  remainingEdits: number;
  canGenerate: boolean;
  canEdit: boolean;
};

export function InviteTextGenerator({
  eventId,
  eventSlug,
  capsuleActive,
  planTier,
  initialCopy,
  initialQuota
}: {
  eventId: string;
  eventSlug: string;
  capsuleActive: boolean;
  planTier: Event["plan"]["tier"];
  initialCopy?: InviteCopy;
  initialQuota: TextQuota;
}) {
  const [copy, setCopy] = useState<InviteCopy | undefined>(initialCopy);
  const [quota, setQuota] = useState(initialQuota);
  const [loading, setLoading] = useState(false);
  const [editHint, setEditHint] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventLink = `${appUrl}/evento/${eventSlug}`;
  const isPaid = capsuleActive && planTier !== "free";

  const whatsappText = copy
    ? copy.whatsapp.includes("{{link}}")
      ? copy.whatsapp.replace(/\{\{link\}\}/g, eventLink)
      : `${copy.whatsapp} ${eventLink}`
    : "";

  async function generate(mode: "generate" | "edit" = "generate") {
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await fetch(`/api/events/${eventId}/generate-invite-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, editHint: mode === "edit" ? editHint : undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar texto.");
        setLoading(false);
        return;
      }
      setCopy(data.inviteCopy);
      if (data.quota) setQuota(data.quota);
      if (mode === "edit") setEditHint("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  async function copyWhatsapp() {
    if (!whatsappText) return;
    await navigator.clipboard.writeText(whatsappText);
    setCopied(true);
  }

  return (
    <article className="card" style={{ padding: 22, marginBottom: 24 }}>
      <span className="pill">texto do convite</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>Mensagens com ChatGPT</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
        {isPaid
          ? `Gera headline, texto da página e mensagem para WhatsApp. Até ${quota.maxEdits} ajustes.`
          : "Plano gratuito: 1 geração de texto (sem ajustes). Ideal para copiar e colar no WhatsApp."}
      </p>

      {copy ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
              headline
            </div>
            <p className="display" style={{ fontSize: 22, margin: 0 }}>{copy.headline}</p>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
              texto da página
            </div>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}>{copy.message}</p>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 6 }}>
              whatsapp
            </div>
            <p style={{ background: "var(--bg-soft)", padding: 14, borderRadius: 12, lineHeight: 1.55, margin: 0 }}>{whatsappText}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" className="btn secondary" onClick={copyWhatsapp}>
                {copied ? "Copiado!" : "Copiar mensagem"}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}
              >
                Abrir no WhatsApp
              </a>
            </div>
          </div>
          {copy.hashtags.length > 0 && (
            <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>{copy.hashtags.join(" ")}</p>
          )}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: copy ? 20 : 0 }}>
        {quota.canGenerate && (
          <button type="button" className="btn" onClick={() => generate("generate")} disabled={loading}>
            {loading ? "Gerando texto..." : copy ? "Regenerar texto" : "✨ Gerar texto do convite com IA"}
          </button>
        )}

        {isPaid && quota.canEdit && copy && (
          <div className="praesentia-form praesentia-form-stack">
            <label className="field">
              <span>Ajuste no texto</span>
              <input
                value={editHint}
                onChange={(e) => setEditHint(e.target.value)}
                placeholder="Ex: deixe mais informal, mencione traje casual..."
                maxLength={400}
              />
            </label>
            <button
              type="button"
              className="btn secondary"
              onClick={() => generate("edit")}
              disabled={loading || editHint.length < 4}
            >
              Ajustar texto com IA ({quota.remainingEdits} restante{quota.remainingEdits !== 1 ? "s" : ""})
            </button>
          </div>
        )}

        {error && <p style={{ color: "var(--coral)", fontSize: 13 }}>{error}</p>}
      </div>
    </article>
  );
}
