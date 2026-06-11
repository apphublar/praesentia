"use client";

import { useMemo, useState } from "react";
import type { InviteCopy } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { inviteCopyGuidance, validateInviteCopyForContinue } from "@/lib/events/invite-text-validation";
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
  compactTitle,
  showContinueHints = false
}: {
  eventId: string;
  eventSlug: string;
  isFundraising?: boolean;
  initialCopy?: InviteCopy;
  initialQuota: TextQuota;
  onCopyChange?: (copy: InviteCopy) => void;
  compactTitle?: string;
  showContinueHints?: boolean;
}) {
  const [copy, setCopy] = useState<InviteCopy>(() => resolveInviteCopy(initialCopy));
  const [quota, setQuota] = useState(initialQuota);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const eventLink = `${appUrl}/evento/${eventSlug}`;
  const validation = useMemo(() => validateInviteCopyForContinue(copy), [copy]);

  function updateCopy(next: InviteCopy) {
    const safe = resolveInviteCopy(next);
    setCopy(safe);
    onCopyChange?.(safe);
    setSaved(false);
    setShowValidation(false);
  }

  async function generateWithAi() {
    if (!copy.headline.trim() && !copy.message.trim()) {
      setError("Preencha pelo menos o título ou o texto principal antes de pedir ajuda da IA.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-invite-text`, {
        method: "POST",
        body: JSON.stringify({ mode: "generate" })
      });
      if (!response.ok) {
        setError(
          response.status === 401
            ? "Não foi possível confirmar sua sessão. Recarregue a página e tente de novo."
            : String(data.error ?? "Erro ao gerar texto.")
        );
        return;
      }
      updateCopy(data.inviteCopy as InviteCopy);
      if (data.quota) setQuota(data.quota as TextQuota);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    } finally {
      setLoading(false);
    }
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
        setError(
          response.status === 401
            ? "Não foi possível confirmar sua sessão. Recarregue a página e tente de novo."
            : String(data.error ?? "Erro ao salvar texto.")
        );
        return;
      }
      updateCopy((data.inviteCopy as InviteCopy) ?? copy);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    } finally {
      setSaving(false);
    }
  }

  const whatsappPreview = previewWhatsappMessage(copy.whatsapp, eventLink);

  return (
    <article className="card dashboard-card invite-text-editor-card">
      <span className="pill">texto do convite</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>
        {compactTitle ?? (isFundraising ? "Texto da vaquinha" : "Texto do convite")}
      </h2>
      <p className="invite-text-editor-lead">{inviteCopyGuidance(isFundraising)}</p>

      <div className="praesentia-form praesentia-form-stack">
        <label className="field">
          <span>Título / headline *</span>
          <input
            value={copy.headline}
            onChange={(e) => updateCopy({ ...copy, headline: e.target.value })}
            maxLength={120}
            placeholder={isFundraising ? "Título da campanha" : "Frase de abertura do convite"}
          />
        </label>
        <label className="field">
          <span>{isFundraising ? "História / descrição *" : "Texto da página *"}</span>
          <textarea
            value={copy.message}
            onChange={(e) => updateCopy({ ...copy, message: e.target.value })}
            maxLength={4000}
            rows={8}
            placeholder="Escreva ou cole o texto que aparecerá na página pública."
          />
        </label>
        <label className="field">
          <span>Mensagem para WhatsApp *</span>
          <textarea
            value={copy.whatsapp}
            onChange={(e) => updateCopy({ ...copy, whatsapp: e.target.value })}
            maxLength={500}
            rows={4}
            placeholder='Use {{link}} onde quiser inserir o link do evento.'
          />
        </label>
        {copy.whatsapp.trim() ? (
          <p className="cover-field-help" style={{ margin: 0 }}>
            Prévia: {whatsappPreview}
          </p>
        ) : null}
      </div>

      {showContinueHints && showValidation && !validation.ok ? (
        <p className="settings-status is-error invite-text-validation">
          Preencha os campos obrigatórios: {validation.missing.join(", ")}.
        </p>
      ) : null}

      <div className="invite-text-editor-actions">
        <button type="button" className="btn secondary" onClick={saveManual} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar texto"}
        </button>
        {quota.canGenerate ? (
          <button type="button" className="btn" onClick={generateWithAi} disabled={loading}>
            {loading ? "Melhorando com IA…" : "✨ Pedir ajuda da IA para melhorar o texto"}
          </button>
        ) : null}
        {saved ? <p className="settings-status is-ok" style={{ margin: 0 }}>Texto salvo.</p> : null}
        {error ? <p className="settings-status is-error">{error}</p> : null}
      </div>
    </article>
  );
}
