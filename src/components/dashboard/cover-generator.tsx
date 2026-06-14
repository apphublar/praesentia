"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { generateEventCoverImageClient } from "@/lib/api/generate-cover";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { resizeDataUrlForCover, resizeImageForCover, urlToDataUrlForCover } from "@/lib/images/resize-host-photo";
import {
  buildInitialCoverEditableFields,
  coverEditableFieldsToOverride,
  COVER_IMAGE_FORMAT,
  toCoverFormEventInput,
  type CoverEditableFields
} from "@/lib/openai/cover-invitation-spec";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { CoverGenerationOverlay } from "@/components/dashboard/cover-generation-overlay";
import type { AiCoverQuota } from "@/lib/plans/features";
import { AI_COVER_PACK_DESCRIPTION } from "@/lib/plans/ai-cover-pack";

export type CoverQuota = AiCoverQuota;

function updateCoverField<K extends keyof CoverEditableFields>(
  setter: React.Dispatch<React.SetStateAction<CoverEditableFields>>,
  key: K,
  value: CoverEditableFields[K]
) {
  setter((current) => ({ ...current, [key]: value }));
}

/* ── Preview do convite (coluna direita) ── */
function InvitePreview({
  coverUrl,
  imageError,
  onImageError,
  eventTitle
}: {
  coverUrl: string;
  imageError: boolean;
  onImageError: () => void;
  eventTitle: string;
}) {
  return (
    <div className="cover-preview-column">
      <p className="cover-preview-format-note">
        Prévia do convite completo · proporção {COVER_IMAGE_FORMAT.aspectRatio} ({COVER_IMAGE_FORMAT.size}).
      </p>
      <div className="cover-phone-frame">
        {coverUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Convite de ${eventTitle || "evento"}`}
            className="cover-phone-image"
            onError={onImageError}
          />
        ) : (
          <div className="cover-phone-placeholder">
            <span style={{ fontSize: 36 }}>{coverUrl && imageError ? "⚠️" : "🎉"}</span>
            <span style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8, textAlign: "center" }}>
              {coverUrl && imageError
                ? "Não foi possível exibir a imagem. Clique em Tentar novamente."
                : "Gere a imagem do convite com IA →"}
            </span>
          </div>
        )}
      </div>

      {coverUrl && !imageError ? (
        <a href={coverUrl} download="convite.png" className="btn secondary cover-share-btn">
          ⬇ Baixar imagem
        </a>
      ) : null}
    </div>
  );
}

/* ── Componente principal ── */
export function CoverGenerator({
  eventId,
  eventSlug,
  planTier,
  capsuleActive,
  currentCoverUrl,
  coverSource,
  hostPhotoUrl: initialHostPhotoUrl,
  pendingUrls = [],
  inviteWhatsappText,
  initialQuota,
  onCoverChange,
  eventTitle = "",
  eventHostName = "",
  eventOrganizerName = "",
  eventTheme = "",
  eventType = "outros",
  eventDate = "",
  eventStartsAt = "",
  eventEndsAt = "",
  eventVenueName = "",
  eventVenueAddress = "",
  eventVenueZip = "",
  eventVenueComplement = "",
  eventCity = "",
  eventFormat = "in_person",
  onlineMeetingUrl
}: {
  eventId: string;
  eventSlug: string;
  planTier: Event["plan"]["tier"];
  capsuleActive: boolean;
  currentCoverUrl?: string;
  coverSource?: Event["coverSource"];
  hostPhotoUrl?: string;
  pendingUrls?: string[];
  inviteWhatsappText?: string;
  initialQuota: CoverQuota;
  onCoverChange?: (url: string) => void;
  eventTitle?: string;
  eventHostName?: string;
  eventOrganizerName?: string;
  eventTheme?: string;
  eventType?: Event["eventType"];
  eventDate?: string;
  eventStartsAt?: string;
  eventEndsAt?: string;
  eventVenueName?: string;
  eventVenueAddress?: string;
  eventVenueZip?: string;
  eventVenueComplement?: string;
  eventCity?: string;
  eventFormat?: Event["eventFormat"];
  onlineMeetingUrl?: string;
}) {
  const coverFormInput = toCoverFormEventInput({
    eventTitle,
    eventType,
    eventHostName,
    eventTheme,
    eventDate,
    eventStartsAt,
    eventEndsAt,
    eventFormat,
    eventVenueName,
    eventVenueAddress,
    eventVenueZip,
    eventVenueComplement,
    eventCity,
    onlineMeetingUrl
  });

  const isFundraisingCover = eventFormat === "fundraising" || eventType === "vaquinha";
  const hostFieldLabel = isFundraisingCover ? "Organizador" : "Homenageado(a)";
  const photoFieldLabel = isFundraisingCover
    ? "Foto de referência (opcional)"
    : "Foto do homenageado (opcional)";
  const photoHelp = isFundraisingCover
    ? "Envie uma foto de pessoa, logo ou imagem que a IA deve usar no convite."
    : "A IA usa a foto para montar o convite com a imagem da pessoa.";

  const [coverUrl, setCoverUrl] = useState(currentCoverUrl ?? "");
  const [imageError, setImageError] = useState(false);
  const [hostPhotoUrl, setHostPhotoUrl] = useState(initialHostPhotoUrl ?? "");
  const [hostPhotoSaved, setHostPhotoSaved] = useState(false);
  const [source, setSource] = useState(coverSource);
  const [pending, setPending] = useState<string[]>(pendingUrls);
  const [quota, setQuota] = useState(initialQuota);
  const [loading, setLoading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [assistingPrompt, setAssistingPrompt] = useState(false);
  const [purchasingPack, setPurchasingPack] = useState(false);
  const [packOk, setPackOk] = useState(false);
  const [promptAssistOk, setPromptAssistOk] = useState(false);
  const [editHint, setEditHint] = useState("");
  const [orientation, setOrientation] = useState("");
  const [photoInstructions, setPhotoInstructions] = useState("");
  const [coverFields, setCoverFields] = useState(() => buildInitialCoverEditableFields(coverFormInput));
  const [error, setError] = useState("");

  const isPaid = capsuleActive && planTier !== "free";

  function applyCover(url: string, nextSource?: Event["coverSource"]) {
    setCoverUrl(url);
    setImageError(false);
    onCoverChange?.(url);
    if (nextSource) setSource(nextSource);
  }

  async function resolvePrimaryPhotoDataUrl() {
    if (!hostPhotoUrl) return null;
    return urlToDataUrlForCover(hostPhotoUrl);
  }

  async function generate(mode: "generate" | "edit" = "generate") {
    setLoading(true);
    setGeneratingCover(true);
    setError("");
    setPromptAssistOk(false);
    try {
      const primaryPhotoDataUrl = await resolvePrimaryPhotoDataUrl();
      const result = await generateEventCoverImageClient({
        eventId,
        mode,
        editHint: mode === "edit" ? editHint : undefined,
        orientation: orientation.trim() || undefined,
        photoInstructions: hostPhotoUrl ? photoInstructions.trim() || undefined : undefined,
        coverFields: coverEditableFieldsToOverride(coverFields),
        primaryPhotoDataUrl,
        promptVersion: mode === "edit" ? "cover-image-correction-v1" : "cover-image-v1"
      });
      if (result.error) { setError(result.error); return; }
      if (typeof result.coverImageUrl === "string") applyCover(result.coverImageUrl, "ai");
      if (Array.isArray(result.pendingUrls)) setPending(result.pendingUrls);
      if (result.quota) setQuota(result.quota);
      if (mode === "edit") setEditHint("");
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    } finally {
      setGeneratingCover(false);
      setLoading(false);
    }
  }

  async function assistCoverPrompt() {
    setAssistingPrompt(true);
    setLoading(true);
    setError("");
    setPromptAssistOk(false);
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover-prompt`, {
        method: "POST",
        body: JSON.stringify({
          draftOrientation: orientation,
          draftPhotoInstructions: photoInstructions,
          withHostPhoto: Boolean(hostPhotoUrl),
          coverFields: coverEditableFieldsToOverride(coverFields)
        })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Erro ao gerar prompt com IA."));
        return;
      }
      if (typeof data.visualDirection === "string" && data.visualDirection.trim()) {
        setOrientation(data.visualDirection.trim());
      }
      if (hostPhotoUrl && typeof data.photoInstructions === "string" && data.photoInstructions.trim()) {
        setPhotoInstructions(data.photoInstructions.trim());
      }
      setPromptAssistOk(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    } finally {
      setAssistingPrompt(false);
      setLoading(false);
    }
  }

  async function selectVersion(url: string) {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover`, {
        method: "POST",
        body: JSON.stringify({ mode: "select", coverImageUrl: url })
      });
      if (!response.ok) { setError(String(data.error ?? "Erro ao selecionar versão.")); setLoading(false); return; }
      if (typeof data.coverImageUrl === "string") applyCover(data.coverImageUrl, "ai");
      setPending(Array.isArray(data.pendingUrls) ? (data.pendingUrls as string[]) : []);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
    setLoading(false);
  }

  async function uploadHostPhoto(file: File) {
    setLoading(true);
    setError("");
    setHostPhotoSaved(false);
    try {
      const resizedDataUrl = await resizeImageForCover(file);
      setHostPhotoUrl(resizedDataUrl);
      const formData = new FormData();
      formData.append("file", file);
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/host-photo`, { method: "POST", body: formData });
      if (!response.ok) { setError(String(data.error ?? "Erro ao enviar foto.")); setLoading(false); return; }
      if (typeof data.hostPhotoUrl === "string") {
        setHostPhotoSaved(true);
        setHostPhotoUrl(data.hostPhotoUrl);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
    setLoading(false);
  }

  async function purchaseAiCoverPack() {
    setPurchasingPack(true);
    setLoading(true);
    setError("");
    setPackOk(false);
    try {
      const { response, data } = await dashboardFetchJson("/api/billing/purchase-ai-cover-pack", {
        method: "POST",
        body: JSON.stringify({ eventId })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Erro ao ativar pacote."));
        return;
      }
      if (data.quota) setQuota(data.quota as CoverQuota);
      setPackOk(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    } finally {
      setPurchasingPack(false);
      setLoading(false);
    }
  }

  async function uploadCustom(file: File) {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/cover`, { method: "POST", body: formData });
      if (!response.ok) { setError(String(data.error ?? "Erro ao enviar convite.")); setLoading(false); return; }
      if (typeof data.coverImageUrl === "string") applyCover(data.coverImageUrl, "custom");
      setPending([]);
      if (data.quota) setQuota(data.quota as CoverQuota);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
    setLoading(false);
  }

  return (
    <article className="card dashboard-card">
      <span className="pill">imagem do convite</span>
      <div className="cover-generator-heading">
        <div>
          <h2 className="display" style={{ fontSize: 28, margin: "12px 0 4px" }}>Imagem para WhatsApp e Stories</h2>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14, margin: 0 }}>
            {isPaid
              ? `Plano pago: até ${quota.maxGenerations} versões por IA e ${quota.maxEdits} ajustes.`
              : quota.freePlan
              ? "Plano gratuito: 1 imagem do convite com IA, texto do convite e assistente de prompt inclusos."
              : "Gere a arte do convite com IA — ou envie a sua própria."}
          </p>
        </div>
        <span className="cover-format-badge">{COVER_IMAGE_FORMAT.label}</span>
      </div>

      <div className="cover-builder-layout">
        <div className="cover-settings-column">
          <div className="praesentia-form praesentia-form-stack">
            <details className="cover-settings-panel" open>
              <summary>Dados na imagem (opcional)</summary>
              <p className="cover-field-help cover-settings-panel-help">
                Pré-preenchidos do cadastro. Campos vazios não entram no convite. Textos aparecem na parte inferior da arte.
              </p>
              <section className="cover-event-brief">
              <div className="cover-event-brief-head">
                <span className="field"><span>Informações do convite</span></span>
              </div>
              <div className="cover-event-brief-grid cover-event-brief-form">
                <label className="field">
                  <span>Título do evento</span>
                  <input value={coverFields.eventTitle} onChange={(e) => updateCoverField(setCoverFields, "eventTitle", e.target.value)} maxLength={160} />
                </label>
                <label className="field">
                  <span>{hostFieldLabel}</span>
                  <input value={coverFields.hostName} onChange={(e) => updateCoverField(setCoverFields, "hostName", e.target.value)} maxLength={120} />
                </label>
                {!isFundraisingCover && eventOrganizerName ? (
                  <label className="field">
                    <span>Organizador(a)</span>
                    <input value={eventOrganizerName} readOnly maxLength={120} />
                  </label>
                ) : null}
                <label className="field">
                  <span>Tema do convite</span>
                  <input value={coverFields.theme} onChange={(e) => updateCoverField(setCoverFields, "theme", e.target.value)} maxLength={160} />
                </label>
                <label className="field">
                  <span>Data do evento</span>
                  <input type="date" value={coverFields.date} onChange={(e) => updateCoverField(setCoverFields, "date", e.target.value)} />
                  <p className="cover-field-help">
                    {coverFields.date
                      ? `Mesma data do cadastro: ${formatEventDateLine(coverFields.date) ?? coverFields.date}. Aparece na parte inferior do convite.`
                      : "Preenchida automaticamente no cadastro do evento. Informe aqui se quiser outra data na imagem."}
                  </p>
                </label>
                <div className="cover-event-brief-row">
                  <label className="field">
                    <span>Horário de início</span>
                    <input type="time" value={coverFields.startsAt} onChange={(e) => updateCoverField(setCoverFields, "startsAt", e.target.value)} />
                  </label>
                  <label className="field">
                    <span>Horário de término</span>
                    <input type="time" value={coverFields.endsAt} onChange={(e) => updateCoverField(setCoverFields, "endsAt", e.target.value)} />
                  </label>
                </div>
                {eventFormat === "online" ? (
                  <label className="field">
                    <span>Link do evento online</span>
                    <input value={coverFields.onlineMeetingUrl} onChange={(e) => updateCoverField(setCoverFields, "onlineMeetingUrl", e.target.value)} maxLength={400} />
                  </label>
                ) : eventFormat !== "fundraising" ? (
                  <>
                    <label className="field">
                      <span>Local / salão</span>
                      <input value={coverFields.venueName} onChange={(e) => updateCoverField(setCoverFields, "venueName", e.target.value)} maxLength={160} />
                    </label>
                    <label className="field">
                      <span>Endereço</span>
                      <input value={coverFields.venueAddress} onChange={(e) => updateCoverField(setCoverFields, "venueAddress", e.target.value)} maxLength={220} />
                    </label>
                    <div className="cover-event-brief-row">
                      <label className="field">
                        <span>CEP</span>
                        <input value={coverFields.venueZip} onChange={(e) => updateCoverField(setCoverFields, "venueZip", e.target.value)} maxLength={12} placeholder="00000-000" />
                      </label>
                      <label className="field">
                        <span>Complemento</span>
                        <input value={coverFields.venueComplement} onChange={(e) => updateCoverField(setCoverFields, "venueComplement", e.target.value)} maxLength={120} placeholder="Apto, bloco, salão..." />
                      </label>
                    </div>
                    <label className="field">
                      <span>Cidade</span>
                      <input value={coverFields.city} onChange={(e) => updateCoverField(setCoverFields, "city", e.target.value)} maxLength={120} />
                    </label>
                  </>
                ) : null}
              </div>
            </section>
            </details>

            <details className="cover-settings-panel">
              <summary>Foto de referência (opcional)</summary>
            <div className="cover-host-photo-block">
              <label className="field">
                <span>{photoFieldLabel}</span>
                <p className="cover-field-help">{photoHelp}</p>
              </label>
              <div className="cover-host-photo-row">
                {hostPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hostPhotoUrl} alt="Foto de referência" width={80} height={80}
                    style={{ borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }} />
                ) : (
                  <div className="cover-host-photo-placeholder">Sem foto</div>
                )}
                <label className="btn secondary cover-host-photo-btn">
                  {hostPhotoUrl ? "Trocar foto" : "Enviar foto"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                    disabled={loading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHostPhoto(f); }} />
                </label>
              </div>
              {hostPhotoSaved ? <p className="settings-status is-ok">Foto salva! Agora gere a imagem com IA.</p> : null}
              <label className="field">
                <span>Como a foto deve aparecer no convite</span>
                <textarea
                  value={photoInstructions}
                  onChange={(e) => { setPhotoInstructions(e.target.value); setPromptAssistOk(false); }}
                  maxLength={400}
                  rows={3}
                  placeholder="Ex: moldura redonda, sem fundo, borda dourada, foto quadrada com fundo branco..."
                  disabled={!hostPhotoUrl}
                />
                <p className="cover-field-help">
                  Descreva formato (redonda, quadrada), fundo (com ou sem), borda (com ou sem) e posição. Só usado quando há foto enviada.
                </p>
              </label>
            </div>
            </details>

            <details className="cover-settings-panel" open>
              <summary>Estilo visual e geração</summary>
            <label className="field">
              <span>Orientação visual da imagem</span>
              <textarea value={orientation} onChange={(e) => { setOrientation(e.target.value); setPromptAssistOk(false); }}
                maxLength={1000} rows={5}
                placeholder="Descreva livremente o estilo do convite: cores, personagens, elementos decorativos, tema..." />
              <p className="cover-field-help">
                Campo livre — a IA segue exatamente o que você escrever aqui para o visual do convite (parte de cima/meio). Não há tema pré-definido.
              </p>
            </label>

            <div className="cover-prompt-assist-row">
              <button
                type="button"
                className="btn secondary"
                onClick={() => assistCoverPrompt()}
                disabled={loading || assistingPrompt}
              >
                {assistingPrompt ? "Criando prompt profissional…" : "✨ Pedir ajuda da IA para criar o prompt perfeito"}
              </button>
              <p className="cover-field-help" style={{ margin: 0 }}>
                Escreva suas ideias nos campos acima (visual e foto). A IA transforma em prompts profissionais com base no que você preencheu — depois é só clicar em gerar imagem.
              </p>
              {promptAssistOk ? (
                <p className="settings-status is-ok" style={{ margin: 0 }}>
                  Prompts prontos! Revise os textos e clique em gerar convite.
                </p>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {quota.testingMode ? (
                <p className="settings-status is-ok" style={{ marginBottom: 0 }}>
                  Modo teste: gerações ilimitadas para avaliar qualidade.
                </p>
              ) : null}
              {(quota.canGenerate || coverUrl || imageError) && (
                <button type="button" className="btn" onClick={() => generate("generate")} disabled={loading || !quota.canGenerate}>
                  {generatingCover ? "Gerando convite com IA…" : quota.testingMode
                    ? "✨ Gerar nova versão (teste)"
                    : isPaid || quota.maxGenerations > 1
                    ? `✨ Gerar versão (${quota.remainingGenerations} restante${quota.remainingGenerations !== 1 ? "s" : ""})`
                    : coverUrl ? "✨ Gerar nova versão" : "✨ Gerar convite com IA"}
                </button>
              )}
              {imageError && !loading && (
                <button type="button" className="btn" onClick={() => generate("generate")} style={{ background: "var(--coral)" }}>
                  ↻ Tentar novamente
                </button>
              )}
              {!quota.canGenerate && !coverUrl && !imageError && (
                <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                  {quota.canPurchasePack
                    ? "Sua imagem gratuita já foi usada. Desbloqueie mais versões abaixo ou envie sua própria imagem."
                    : "Limite de gerações atingido. Envie sua própria imagem abaixo."}
                </p>
              )}
              {!quota.canGenerate && coverUrl && !imageError && (
                <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>
                  {quota.canPurchasePack
                    ? "Limite de gerações atingido. Compre o pacote extra ou envie sua própria imagem."
                    : "Limite de gerações atingido neste evento."}
                </p>
              )}

              {quota.canPurchasePack && !quota.testingMode && (!quota.canGenerate || !quota.canEdit) ? (
                <div className="cover-pack-offer">
                  <p className="cover-pack-offer-title">Precisa de mais versões ou ajustes?</p>
                  <p className="cover-pack-offer-text">
                    Por <strong>{quota.packPriceLabel ?? "R$ 4,90"}</strong> você libera {AI_COVER_PACK_DESCRIPTION.toLowerCase()}
                  </p>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => purchaseAiCoverPack()}
                    disabled={loading || purchasingPack}
                  >
                    {purchasingPack ? "Ativando pacote…" : `Desbloquear pacote (${quota.packPriceLabel ?? "R$ 4,90"})`}
                  </button>
                  {packOk ? (
                    <p className="settings-status is-ok" style={{ margin: 0 }}>
                      Pacote ativado! Agora você pode gerar mais versões ou pedir ajustes.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {coverUrl && source === "ai" && (
                <div className="praesentia-form praesentia-form-stack">
                  <label className="field">
                    <span>Ajuste na imagem</span>
                    <input value={editHint} onChange={(e) => setEditHint(e.target.value)}
                      placeholder="Ex: usar cores mais quentes, adicionar borboletas..."
                      maxLength={400}
                      disabled={!quota.canEdit} />
                  </label>
                  {quota.canEdit ? (
                    <button type="button" className="btn secondary" onClick={() => generate("edit")}
                      disabled={loading || editHint.length < 4}>
                      Pedir ajuste à IA ({quota.remainingEdits} restante{quota.remainingEdits !== 1 ? "s" : ""})
                    </button>
                  ) : quota.canPurchasePack ? (
                    <p className="cover-field-help" style={{ margin: 0 }}>
                      Ajustes com IA estão no pacote extra ({quota.packPriceLabel ?? "R$ 4,90"}).
                    </p>
                  ) : (
                    <p className="cover-field-help" style={{ margin: 0 }}>Limite de ajustes atingido neste evento.</p>
                  )}
                </div>
              )}

              {quota.allowsCustomUpload && (
                <label className="btn secondary" style={{ textAlign: "center", cursor: "pointer" }}>
                  Enviar minha própria imagem
                  <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCustom(f); }} />
                </label>
              )}

              {pending.length > 1 && (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Escolha uma versão:</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {pending.map((url) => (
                      <button key={url} type="button" onClick={() => selectVersion(url)} disabled={loading}
                        style={{ border: coverUrl === url ? "2.5px solid var(--coral)" : "1px solid var(--line)", borderRadius: 10, padding: 3, background: "#fff", cursor: "pointer" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Versão" width={72} height={128}
                          style={{ borderRadius: 8, objectFit: "cover", display: "block" }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error ? <p className="settings-status is-error">{error}</p> : null}
            </div>
            </details>
          </div>
        </div>

        {/* ── Coluna direita: preview ao vivo ── */}
        <InvitePreview
          coverUrl={coverUrl}
          imageError={imageError}
          onImageError={() => setImageError(true)}
          eventTitle={coverFields.eventTitle || eventTitle}
        />
      </div>

      <CoverGenerationOverlay active={generatingCover} capsuleActive={capsuleActive} />
    </article>
  );
}
