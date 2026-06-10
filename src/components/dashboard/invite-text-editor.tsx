"use client";

import { useState } from "react";
import type { InviteCopy } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { previewWhatsappMessage, resolveInviteCopy } from "@/lib/events/invite-copy";

export type TextQuota = {
  maxGenerations: number;
  maxEdits: number;
  remainingGenerations: number;
  remainingEdits: number;
  canGenerate: boolean;
  canEdit: boolean;
};

export function InviteTextEditor({
  eventId,
  eventSlug,
  isFundraising = false,
  initialCopy,
  initialQuota,
  onCopyChange,
  compactTitle
}: {
  eventId: string;
  eventSlug: string;
  isFundraising?: boolean;
  initialCopy?: InviteCopy;
  initialQuota: TextQuota;
  onCopyChange?: (copy: InviteCopy) => void;
  compactTitle?: string;
}) {
  const [copy, setCopy] = useState<InviteCopy>(() => resolveInviteCopy(initialCopy));
  const [quota, setQuota] = useState(initialQuota);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventLink = `${appUrl}/evento/${eventSlug}`;

  function updateCopy(next: InviteCopy) {
    const safe = resolveInviteCopy(next);
    setCopy(safe);
    onCopyChange?.(safe);
    setSaved(false);
  }

  async function generateWithAi() {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-invite-text`, {
        method: "POST",
        body: JSON.stringify({ mode: "generate" })
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Não foi possível confirmar sua sessão. Recarregue a página e tente de novo." : String(data.error ?? "Erro ao gerar texto."));
        setLoading(false);
        return;
      }
      updateCopy(data.inviteCopy as InviteCopy);
      if (data.quota) setQuota(data.quota as TextQuota);
      setSaved(true);
    } catch (error) {
      setError(apiErrorMessage(error, "Erro de conexão. Tente novamente."));
    }
    setLoading(false);
  }

  async function saveManual() {
    setSaving(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/invite-copy`, {
        method: "PATCH",
        body: JSON.stringify({ inviteCopy: copy })
      });
      if (!response.ok) {
        setError(response.status === 401 ? "Não foi possível confirmar sua sessão. Recarregue a página e tente de novo." : String(data.error ?? "Erro ao salvar texto."));
        setSaving(false);
        return;
      }
      updateCopy((data.inviteCopy as InviteCopy) ?? copy);
      setSaved(true);
    } catch (error) {
      setError(apiErrorMessage(error, "Erro de conexão. Tente novamente."));
    }
    setSaving(false);
  }

  const whatsappPreview = previewWhatsappMessage(copy.whatsapp, eventLink);

  return (
    <article className="card dashboard-card">
      <span className="pill">texto do convite</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>
        {compactTitle ?? (isFundraising ? "Texto da vaquinha" : "Texto do convite")}
      </h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
        Edite livremente ou use a IA uma vez no plano gratuito. A data e o local vêm dos dados que você informou.
      </p>

      <div className="praesentia-form praesentia-form-stack">
        <label className="field">
          <span>Título / headline</span>
          <input
            value={copy.headline}
            onChange={(e) => updateCopy({ ...copy, headline: e.target.value })}
            maxLength={120}
            placeholder={isFundraising ? "Título da campanha" : "Frase de abertura do convite"}
          />
        </label>
        <label className="field">
          <span>{isFundraising ? "História / descrição" : "Texto da página"}</span>
          <textarea
            value={copy.message}
            onChange={(e) => updateCopy({ ...copy, message: e.target.value })}
            maxLength={4000}
            rows={8}
            placeholder="Escreva ou cole o texto que aparecerá na página pública."
          />
        </label>
        <label className="field">
          <span>Mensagem para WhatsApp</span>
          <textarea
            value={copy.whatsapp}
            onChange={(e) => updateCopy({ ...copy, whatsapp: e.target.value })}
            maxLength={500}
            rows={4}
            placeholder='Use {{link}} onde quiser inserir o link do evento.'
          />
        </label>
        {copy.whatsapp.trim() ? (
          <p style={{ color: "var(--ink-soft)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            Prévia: {whatsappPreview}
          </p>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        <button type="button" className="btn secondary" onClick={saveManual} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar texto"}
        </button>
        {quota.canGenerate ? (
          <button type="button" className="btn" onClick={generateWithAi} disabled={loading}>
            {loading ? "Gerando..." : "✨ Gerar sugestão com IA (1x)"}
          </button>
        ) : null}
        {saved ? <p className="settings-status is-ok">Texto salvo. O checklist foi atualizado.</p> : null}
        {error ? <p className="settings-status is-error">{error}</p> : null}
      </div>
    </article>
  );
}
