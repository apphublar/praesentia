"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";

export type CoverQuota = {
  maxGenerations: number;
  maxEdits: number;
  remainingGenerations: number;
  remainingEdits: number;
  canGenerate: boolean;
  canEdit: boolean;
  allowsCustomUpload: boolean;
};

const DEFAULT_INCLUDE = { title: true, date: true, location: true, hostName: true, theme: true };

/* ── Preview do convite (coluna direita) ── */
function InvitePreview({
  coverUrl,
  imageError,
  onImageError,
  eventTitle,
  eventHostName,
  eventDate,
  eventStartsAt,
  eventEndsAt,
  eventVenueName,
  eventCity,
  eventFormat,
  onlineMeetingUrl,
  shareLink,
  waMessage,
  canDownload
}: {
  coverUrl: string;
  imageError: boolean;
  onImageError: () => void;
  eventTitle: string;
  eventHostName: string;
  eventDate: string;
  eventStartsAt: string;
  eventEndsAt: string;
  eventVenueName: string;
  eventCity: string;
  eventFormat: Event["eventFormat"];
  onlineMeetingUrl?: string;
  shareLink: string;
  waMessage: string;
  canDownload: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const dateLabel = eventDate
    ? new Date(`${eventDate}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;
  const timeLabel = eventStartsAt && eventEndsAt ? `${eventStartsAt}–${eventEndsAt}` : eventStartsAt || null;
  const locationLabel =
    eventFormat === "online" ? (onlineMeetingUrl || "Evento online") :
    eventFormat === "fundraising" ? "Contribuição via Pix" :
    `${eventVenueName}${eventCity ? `, ${eventCity}` : ""}`;

  async function handleShare() {
    if (coverUrl && !imageError && typeof navigator !== "undefined" && navigator.share) {
      try {
        let fileToShare: File | null = null;
        if (!coverUrl.startsWith("data:")) {
          const res = await fetch(coverUrl);
          if (res.ok) {
            const blob = await res.blob();
            fileToShare = new File([blob], "convite.png", { type: blob.type || "image/png" });
          }
        }

        const shareData: ShareData = { title: eventTitle, text: waMessage, url: shareLink };
        if (fileToShare && navigator.canShare?.({ files: [fileToShare] })) {
          (shareData as ShareData & { files: File[] }).files = [fileToShare];
        }
        await navigator.share(shareData);
        return;
      } catch {
        /* fall through to WhatsApp link */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(waMessage)}`, "_blank", "noopener");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="cover-preview-column">
      <div className="cover-phone-frame">
        {coverUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Convite de ${eventTitle}`}
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

        <div className="cover-phone-details">
          {eventTitle && (
            <div className="cover-phone-title">{eventTitle}</div>
          )}
          {eventHostName && (
            <div className="cover-phone-host">{eventHostName}</div>
          )}
          {(dateLabel || timeLabel) && (
            <div className="cover-phone-meta">
              <span>📅</span>
              <span>{[dateLabel, timeLabel].filter(Boolean).join(" · ")}</span>
            </div>
          )}
          {locationLabel && (
            <div className="cover-phone-meta">
              <span>{eventFormat === "online" ? "💻" : eventFormat === "fundraising" ? "💙" : "📍"}</span>
              <span>{locationLabel}</span>
            </div>
          )}
          <div className="cover-phone-rsvp-btn">Confirmar presença</div>
        </div>
      </div>

      <div className="cover-share-section">
        <div className="cover-share-link-row">
          <span className="cover-share-link-label">Link do convite:</span>
          <code className="cover-share-link-code">{shareLink}</code>
          <button type="button" className="btn secondary cover-share-copy-btn" onClick={copyLink}>
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>

        <div className="cover-share-actions">
          {canDownload && coverUrl && !imageError && (
            <a href={coverUrl} download="convite.png" className="btn secondary cover-share-btn">
              ⬇ Baixar imagem
            </a>
          )}
          <button type="button" className="btn cover-share-whatsapp-btn" onClick={handleShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar convite no WhatsApp
          </button>
        </div>
      </div>
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
  eventDate = "",
  eventStartsAt = "",
  eventEndsAt = "",
  eventVenueName = "",
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
  eventDate?: string;
  eventStartsAt?: string;
  eventEndsAt?: string;
  eventVenueName?: string;
  eventCity?: string;
  eventFormat?: Event["eventFormat"];
  onlineMeetingUrl?: string;
}) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl ?? "");
  const [imageError, setImageError] = useState(false);
  const [hostPhotoUrl, setHostPhotoUrl] = useState(initialHostPhotoUrl ?? "");
  const [hostPhotoSaved, setHostPhotoSaved] = useState(false);
  const [source, setSource] = useState(coverSource);
  const [pending, setPending] = useState<string[]>(pendingUrls);
  const [quota, setQuota] = useState(initialQuota);
  const [loading, setLoading] = useState(false);
  const [editHint, setEditHint] = useState("");
  const [orientation, setOrientation] = useState("");
  const [includeFields, setIncludeFields] = useState(DEFAULT_INCLUDE);
  const [error, setError] = useState("");

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareLink = `${appUrl}/evento/${eventSlug}`;
  const waMessage = inviteWhatsappText
    ? inviteWhatsappText.replace(/\{\{link\}\}/g, shareLink)
    : `Você está convidado(a) para ${eventTitle || "o evento"}! Confirme sua presença: ${shareLink}`;
  const isPaid = capsuleActive && planTier !== "free";

  function applyCover(url: string, nextSource?: Event["coverSource"]) {
    setCoverUrl(url);
    setImageError(false);
    onCoverChange?.(url);
    if (nextSource) setSource(nextSource);
  }

  async function generate(mode: "generate" | "edit" = "generate") {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/generate-cover`, {
        method: "POST",
        body: JSON.stringify({
          mode,
          editHint: mode === "edit" ? editHint : undefined,
          orientation: orientation || undefined,
          includeFields
        })
      });
      if (!response.ok) { setError(String(data.error ?? "Erro ao gerar imagem.")); setLoading(false); return; }
      if (typeof data.coverImageUrl === "string") applyCover(data.coverImageUrl, "ai");
      if (Array.isArray(data.pendingUrls)) setPending(data.pendingUrls as string[]);
      if (data.quota) setQuota(data.quota as CoverQuota);
      if (mode === "edit") setEditHint("");
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão. Tente novamente."));
    }
    setLoading(false);
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
    const previewUrl = URL.createObjectURL(file);
    setHostPhotoUrl(previewUrl);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { response, data } = await dashboardFetchJson(`/api/events/${eventId}/host-photo`, { method: "POST", body: formData });
      if (!response.ok) { setError(String(data.error ?? "Erro ao enviar foto.")); setLoading(false); return; }
      if (typeof data.hostPhotoUrl === "string") {
        URL.revokeObjectURL(previewUrl);
        setHostPhotoUrl(data.hostPhotoUrl);
        setHostPhotoSaved(true);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
    setLoading(false);
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
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0 4px" }}>Imagem para WhatsApp e Stories</h2>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14, marginBottom: 20 }}>
        {isPaid
          ? `Plano pago: até ${quota.maxGenerations} versões por IA e ${quota.maxEdits} ajustes.`
          : "Gere a arte do convite com IA uma vez gratuitamente — ou envie a sua própria."}
      </p>

      <div className="cover-builder-layout">
        {/* ── Coluna esquerda: configurações ── */}
        <div className="cover-settings-column">
          <div className="praesentia-form praesentia-form-stack">
            <div className="cover-host-photo-block">
              <label className="field">
                <span>Foto do homenageado (opcional)</span>
                <p className="cover-field-help">A IA usa a foto para montar o convite com a imagem da pessoa.</p>
              </label>
              <div className="cover-host-photo-row">
                {hostPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hostPhotoUrl} alt="Foto do homenageado" width={80} height={80}
                    style={{ borderRadius: 10, objectFit: "cover", border: "1px solid var(--line)", flexShrink: 0 }}
                    onError={() => setHostPhotoUrl("")} />
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
            </div>

            <div>
              <span className="field"><span>O que incluir na arte</span></span>
              <div className="cover-include-grid">
                {(Object.keys(DEFAULT_INCLUDE) as Array<keyof typeof DEFAULT_INCLUDE>).map((key) => (
                  <label key={key} className="settings-switch cover-include-option">
                    <input type="checkbox" checked={includeFields[key]}
                      onChange={(e) => setIncludeFields((c) => ({ ...c, [key]: e.target.checked }))} />
                    <span>
                      {key === "title" && "Título"}
                      {key === "date" && "Data"}
                      {key === "location" && "Local / link"}
                      {key === "hostName" && "Organizador"}
                      {key === "theme" && "Tema"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="field">
              <span>Descreva a imagem que você quer</span>
              <textarea value={orientation} onChange={(e) => setOrientation(e.target.value)}
                maxLength={400} rows={3}
                placeholder="Ex: convite rosa e dourado com flores, estilo elegante, fundo claro, vibe festa infantil..." />
            </label>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(quota.canGenerate || (imageError && coverUrl)) && (
                <button type="button" className="btn" onClick={() => generate("generate")} disabled={loading}>
                  {loading ? "Gerando com IA… (até 1 min)" : isPaid
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
                <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Limite de gerações atingido. Envie sua própria imagem abaixo.</p>
              )}

              {isPaid && quota.canEdit && coverUrl && source === "ai" && (
                <div className="praesentia-form praesentia-form-stack">
                  <label className="field">
                    <span>Ajuste na imagem</span>
                    <input value={editHint} onChange={(e) => setEditHint(e.target.value)}
                      placeholder="Ex: usar cores mais quentes, adicionar borboletas..."
                      maxLength={400} />
                  </label>
                  <button type="button" className="btn secondary" onClick={() => generate("edit")}
                    disabled={loading || editHint.length < 4}>
                    Pedir ajuste à IA ({quota.remainingEdits} restante{quota.remainingEdits !== 1 ? "s" : ""})
                  </button>
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
          </div>
        </div>

        {/* ── Coluna direita: preview ao vivo ── */}
        <InvitePreview
          coverUrl={coverUrl}
          imageError={imageError}
          onImageError={() => setImageError(true)}
          eventTitle={eventTitle}
          eventHostName={eventHostName}
          eventDate={eventDate}
          eventStartsAt={eventStartsAt}
          eventEndsAt={eventEndsAt}
          eventVenueName={eventVenueName}
          eventCity={eventCity}
          eventFormat={eventFormat}
          onlineMeetingUrl={onlineMeetingUrl}
          shareLink={shareLink}
          waMessage={waMessage}
          canDownload={quota.allowsCustomUpload}
        />
      </div>
    </article>
  );
}
