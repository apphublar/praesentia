"use client";

import { useRef, useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { ArtStylePicker } from "@/components/app/ui/art-style-picker";
import { Icon } from "@/components/app/ui/icon";
import { InviteArt } from "@/components/app/ui/invite-art";
import { InviteAiUpgradeModal } from "@/components/app/invite-ai-upgrade-modal";
import { Mono, Segmented, Shimmer, Tag, Toggle } from "@/components/app/ui/primitives";
import { CoverGenerationOverlay } from "@/components/dashboard/cover-generation-overlay";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import type { TextQuota } from "@/components/dashboard/invite-text-editor";
import { generateEventCoverImageClient, selectCoverVersionClient } from "@/lib/api/generate-cover";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { downloadCoverImage } from "@/lib/images/download-cover-image";
import { buildPhotoZoneInstructions, type PhotoOverlayConfig, type PhotoShape, type PhotoSize } from "@/lib/images/photo-zone-instructions";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { resolveInviteCopy } from "@/lib/events/invite-copy";
import { artStylePrompt, type ArtStyle } from "@/lib/openai/art-styles";
import { buildInitialCoverEditableFields, coverEditableFieldsToOverride, toCoverFormEventInput } from "@/lib/openai/cover-invitation-spec";
import { resizeImageForCover, urlToDataUrlForCover } from "@/lib/images/resize-host-photo";

const PHOTO_POSITIONS = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"] as const;

type InviteCoverMode = "ai" | "custom";

function buildPhotoConfig(input: {
  photoUrl: string;
  photoShape: PhotoShape;
  photoPos: (typeof PHOTO_POSITIONS)[number];
  photoSize: PhotoSize;
  removeBackground: boolean;
  photoNotes: string;
}): PhotoOverlayConfig {
  return {
    imageUrl: input.photoUrl,
    shape: input.photoShape,
    pos: input.photoPos,
    size: input.photoSize,
    removeBackground: input.removeBackground,
    notes: input.photoNotes.trim() || undefined
  };
}

function formatTimeShort(time: string) {
  const [h, m] = time.split(":");
  return `${h}h${m === "00" ? "" : m}`;
}

function placeLabel(event: Event) {
  if (event.venueName === "Local a definir") return "Local a definir";
  if (event.eventFormat === "online") return "Evento online";
  return event.venueName;
}

function FieldWithAi({
  label,
  hint,
  value,
  onChange,
  onBlur,
  placeholder,
  rows,
  loading,
  onGenerate,
  generateLabel,
  generateAgainLabel,
  disabled
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  rows: number;
  loading: boolean;
  onGenerate: () => void;
  generateLabel: string;
  generateAgainLabel: string;
  disabled?: boolean;
}) {
  return (
    <>
      <span className="fl">{label}</span>
      {hint ? (
        <p style={{ margin: "0 0 10px", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45 }}>{hint}</p>
      ) : null}
      <div style={{ position: "relative" }}>
        <textarea
          className="input"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={loading}
          style={{ opacity: loading ? 0.55 : 1, marginBottom: 0 }}
        />
        {loading ? (
          <div
            style={{
              position: "absolute",
              inset: "10px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,.72)",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none"
            }}
          >
            <Shimmer lines={rows > 3 ? 4 : 3} />
          </div>
        ) : null}
      </div>
      <button
        type="button"
        className="btn btn-dark btn-sm"
        style={{ marginTop: 12, width: "100%" }}
        onClick={onGenerate}
        disabled={loading || disabled}
      >
        <Icon name="spark" size={14} />
        {loading ? "Gerando…" : value.trim() ? generateAgainLabel : generateLabel}
      </button>
    </>
  );
}

export function InviteArtStep({
  event,
  textQuota,
  coverQuota,
  onCoverChange,
  onCopyChange
}: {
  event: Event;
  textQuota: TextQuota;
  coverQuota: CoverQuota;
  onCoverChange: (url: string) => void;
  onCopyChange: (copy: InviteCopy) => void;
}) {
  const [genText, setGenText] = useState(false);
  const [inviteText, setInviteText] = useState(event.inviteCopy?.message ?? "");
  const [artStyle, setArtStyle] = useState<ArtStyle>("Elegante");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [genPrompt, setGenPrompt] = useState(false);
  const [includeInfo, setIncludeInfo] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(event.hostPhotoUrl ?? "");
  const [photoName, setPhotoName] = useState("");
  const [photoShape, setPhotoShape] = useState<PhotoShape>("original");
  const [photoPos, setPhotoPos] = useState<(typeof PHOTO_POSITIONS)[number]>("br");
  const [photoSize, setPhotoSize] = useState<PhotoSize>("md");
  const [removeBackground, setRemoveBackground] = useState(Boolean(event.hostPhotoUrl));
  const [photoNotes, setPhotoNotes] = useState("");
  const [coverMode, setCoverMode] = useState<InviteCoverMode>(event.coverSource === "custom" ? "custom" : "ai");
  const [imgState, setImgState] = useState<"empty" | "loading" | "done">(event.coverImageUrl ? "done" : "empty");
  const [coverUrl, setCoverUrl] = useState(event.coverImageUrl ?? "");
  const [pendingUrls, setPendingUrls] = useState<string[]>(event.aiCoverPendingUrls ?? []);
  const [quota, setQuota] = useState<CoverQuota>(coverQuota);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeSource, setUpgradeSource] = useState<"after_free_generation" | "retry_without_pack">("after_free_generation");
  const versionTrackRef = useRef<HTMLDivElement>(null);
  const [coverFileName, setCoverFileName] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const isAiMode = coverMode === "ai";
  const previewBusy = isAiMode ? imgState === "loading" : uploadingCover;

  const currentPhoto = photoUrl
    ? buildPhotoConfig({ photoUrl, photoShape, photoPos, photoSize, removeBackground, photoNotes })
    : null;

  const coverFields = buildInitialCoverEditableFields(
    toCoverFormEventInput({
      eventTitle: event.title,
      eventType: event.eventType,
      eventHostName: event.hostName,
      eventTheme: event.theme,
      eventDate: event.date,
      eventStartsAt: event.startsAt,
      eventEndsAt: event.endsAt,
      eventVenueName: event.venueName,
      eventVenueAddress: event.venueAddress,
      eventVenueZip: event.venueZip,
      eventVenueComplement: event.venueComplement,
      eventCity: event.city,
      eventFormat: event.eventFormat,
      onlineMeetingUrl: event.onlineMeetingUrl
    })
  );

  async function downloadCover() {
    if (!coverUrl) return;
    setDownloading(true);
    setError("");
    try {
      const ext = coverUrl.includes("image/png") || coverUrl.endsWith(".png") ? "png" : "jpg";
      await downloadCoverImage(coverUrl, `convite-${event.slug || event.id}.${ext}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível baixar a imagem."));
    } finally {
      setDownloading(false);
    }
  }

  // Prévia de posição só no placeholder (antes de existir capa).
  const previewPhoto = currentPhoto && !coverUrl ? currentPhoto : null;
  const previewCoverUrl = coverUrl || undefined;

  async function generateText() {
    setGenText(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/generate-invite-text`, {
        method: "POST",
        body: JSON.stringify({
          mode: "generate",
          editHint: inviteText.trim() || undefined
        })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Não consegui gerar agora, tente de novo."));
        return;
      }
      const copy = data.inviteCopy as InviteCopy;
      setInviteText(copy.message);
      onCopyChange(copy);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setGenText(false);
    }
  }

  async function generateProPrompt() {
    setGenPrompt(true);
    setError("");
    try {
      const styleLine = artStylePrompt(artStyle);
      const draft = coverPrompt.trim()
        ? `${coverPrompt.trim()}. ${styleLine}.`
        : styleLine;
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/generate-cover-prompt`, {
        method: "POST",
        body: JSON.stringify({
          draftOrientation: draft,
          draftPhotoInstructions: currentPhoto ? buildPhotoZoneInstructions(currentPhoto) : "",
          withHostPhoto: Boolean(photoUrl),
          coverFields: coverEditableFieldsToOverride(coverFields)
        })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Não consegui gerar o prompt."));
        return;
      }
      setCoverPrompt(String(data.visualDirection ?? data.prompt ?? ""));
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setGenPrompt(false);
    }
  }

  async function generateImage() {
    if (!quota.canGenerate) {
      setUpgradeSource("retry_without_pack");
      setShowUpgradeModal(true);
      return;
    }

    setImgState("loading");
    setError("");
    try {
      const fields = { ...coverFields };
      if (!includeInfo) {
        fields.date = "";
        fields.startsAt = "";
        fields.venueName = "";
        fields.city = "";
      }
      const hasPhoto = Boolean(photoUrl);
      const photoConfig = hasPhoto
        ? buildPhotoConfig({ photoUrl, photoShape, photoPos, photoSize, removeBackground, photoNotes })
        : null;
      const primaryPhotoDataUrl = photoUrl ? await urlToDataUrlForCover(photoUrl) : null;
      if (photoUrl && !primaryPhotoDataUrl) {
        setError("Não foi possível carregar a foto do homenageado. Tente enviar novamente.");
        setImgState(coverUrl ? "done" : "empty");
        return;
      }
      const orientation = coverPrompt.trim()
        ? `${coverPrompt.trim()}. ${artStylePrompt(artStyle)}.`
        : artStylePrompt(artStyle);
      const result = await generateEventCoverImageClient({
        eventId: event.id,
        mode: "generate",
        orientation,
        photoInstructions: photoConfig ? buildPhotoZoneInstructions(photoConfig) : undefined,
        primaryPhotoDataUrl,
        coverFields: coverEditableFieldsToOverride(fields)
      });
      if (result.error) {
        if (result.error.toLowerCase().includes("limite") || result.error.toLowerCase().includes("versão")) {
          setUpgradeSource("retry_without_pack");
          setShowUpgradeModal(true);
        }
        setError(result.error);
        setImgState(coverUrl ? "done" : "empty");
        return;
      }
      const finalUrl = result.coverImageUrl;
      if (!finalUrl) return;
      if (Array.isArray(result.pendingUrls)) {
        setPendingUrls(result.pendingUrls);
      } else if (quota.showVersionCarousel) {
        setPendingUrls((current) => [...current, finalUrl].slice(-(quota.perEventMax ?? 3)));
      }
      if (result.quota) {
        setQuota(result.quota);
        if (result.quota.canPurchaseUpgrade && !result.quota.canGenerate) {
          setUpgradeSource("after_free_generation");
          setShowUpgradeModal(true);
        }
      }
      setCoverUrl(finalUrl);
      onCoverChange(finalUrl);
      setImgState("done");
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
      setImgState(coverUrl ? "done" : "empty");
    }
  }

  async function selectVersion(url: string) {
    setError("");
    try {
      await selectCoverVersionClient(event.id, url);
      setCoverUrl(url);
      onCoverChange(url);
      setPendingUrls([]);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível selecionar esta versão."));
    }
  }

  function scrollVersions(direction: -1 | 1) {
    versionTrackRef.current?.scrollBy({ left: direction * 120, behavior: "smooth" });
  }

  async function uploadCover(file: File) {
    setUploadingCover(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/cover`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        setError(String(data.error ?? "Erro ao enviar convite."));
        return;
      }
      if (typeof data.coverImageUrl === "string") {
        setCoverUrl(data.coverImageUrl);
        onCoverChange(data.coverImageUrl);
        setCoverFileName(file.name);
        setImgState("done");
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setUploadingCover(false);
    }
  }

  async function uploadPhoto(file: File) {
    setError("");
    try {
      await resizeImageForCover(file);
      const formData = new FormData();
      formData.append("file", file);
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/host-photo`, {
        method: "POST",
        body: formData
      });
      if (!response.ok) {
        setError(String(data.error ?? "Erro ao enviar foto."));
        return;
      }
      if (typeof data.hostPhotoUrl === "string") {
        setPhotoUrl(data.hostPhotoUrl);
        setPhotoName(file.name);
        setRemoveBackground(true);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
  }

  async function saveCopy() {
    const copy = resolveInviteCopy({
      headline: event.title,
      message: inviteText,
      whatsapp: event.inviteCopy?.whatsapp ?? `Você está convidado(a) para ${event.title}. Confirme aqui: {{link}}`,
      hashtags: event.inviteCopy?.hashtags ?? []
    });
    await dashboardFetchJson(`/api/events/${event.id}/invite-copy`, {
      method: "PATCH",
      body: JSON.stringify({ inviteCopy: copy })
    });
    onCopyChange(copy);
  }

  return (
    <div className="invite-art-grid">
      <div>
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <span className="fl">Como você quer a imagem do convite?</span>
          <Segmented
            full
            value={coverMode}
            onChange={setCoverMode}
            options={[
              { v: "ai" as const, l: "Gerar com IA" },
              { v: "custom" as const, l: "Enviar minha imagem" }
            ]}
          />
          <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45 }}>
            {isAiMode
              ? "A IA cria a arte com base no estilo, prompt e foto do homenageado (opcional)."
              : "Envie o convite que você já criou. Só falta o texto que acompanha o link."}
          </p>
        </div>

        {isAiMode ? (
        <>
        {/* 1 — Foto do homenageado */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="user" size={17} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Foto do homenageado</strong>
            <span style={{ fontSize: 11.5, color: "var(--faint)" }}>· opcional</span>
          </div>

          {photoUrl ? (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--card-2)",
                  border: "1px solid var(--line)"
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 999, overflow: "hidden", flexShrink: 0, border: "2px solid #fff", boxShadow: "0 2px 6px -2px rgba(0,0,0,.3)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{photoName || "Foto enviada"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Ajuste formato, tamanho e posição</div>
                </div>
                <button type="button" onClick={() => setPhotoUrl("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--faint)", padding: 4 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              <div style={{ padding: 14, borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
                <span className="fl">Formato da foto</span>
                <Segmented
                  full
                  value={photoShape}
                  onChange={(shape) => setPhotoShape(shape)}
                  options={[
                    { v: "original" as const, l: "Original" },
                    { v: "round" as const, l: "Redonda" },
                    { v: "square" as const, l: "Quadrada" }
                  ]}
                />
                <span className="fl" style={{ marginTop: 14 }}>
                  Tamanho da foto
                </span>
                <Segmented
                  full
                  value={photoSize}
                  onChange={(size) => setPhotoSize(size)}
                  options={[
                    { v: "sm" as const, l: "Pequena" },
                    { v: "md" as const, l: "Média" },
                    { v: "lg" as const, l: "Grande" },
                    { v: "xl" as const, l: "Extra" }
                  ]}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#fff", border: "1px solid var(--line)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>Remover fundo da foto do homenageado</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>
                      A IA usa a foto enviada junto com o prompt e remove o fundo ao criar o convite integrado.
                    </div>
                  </div>
                  <Toggle
                    on={removeBackground}
                    onChange={setRemoveBackground}
                  />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 14 }}>
                  <div style={{ flexShrink: 0 }}>
                    <span className="fl">Posição na arte</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, width: 104 }}>
                      {PHOTO_POSITIONS.map((p) => {
                        const on = photoPos === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPhotoPos(p)}
                            aria-label={p}
                            style={{
                              aspectRatio: "1 / 1",
                              borderRadius: 7,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: on ? "var(--ink)" : "#fff",
                              border: `1.5px solid ${on ? "var(--ink)" : "var(--line-2)"}`,
                              transition: "all .12s"
                            }}
                          >
                            <span
                              style={{
                                width: 9,
                                height: 9,
                                background: on ? "var(--coral)" : "var(--line-2)",
                                borderRadius: photoShape === "square" ? 2 : photoShape === "original" ? 1 : 99
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="fl">Orientação sobre a foto</span>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: "var(--muted)", lineHeight: 1.45 }}>
                      Opcional. Se a foto tiver várias pessoas ou algo a ajustar, descreva o que manter ou remover — a IA segue junto com as configurações acima.
                    </p>
                    <textarea
                      className="input"
                      rows={3}
                      value={photoNotes}
                      onChange={(e) => setPhotoNotes(e.target.value)}
                      placeholder="Ex.: manter só a mãe e a filha, remover as outras pessoas e o fundo da parede…"
                      style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 0 }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <label
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                background: "#fff",
                border: "1.5px dashed var(--line-2)"
              }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--card-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--coral-deep)" }}>
                <Icon name="image" size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>Adicionar foto do homenageado</span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>JPG ou PNG · arraste ou clique</span>
              </span>
              <Icon name="plus" size={17} style={{ color: "var(--muted)" }} />
            </label>
          )}
        </div>

        {/* 2 — Arte do convite */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="image" size={17} style={{ color: "var(--coral)" }} />
              <strong style={{ fontSize: 14 }}>Arte do convite</strong>
            </div>
            <Tag>1 grátis</Tag>
          </div>

          <span className="fl">Tema da festa</span>
          <input className="input" value={event.theme} readOnly style={{ marginBottom: 14, background: "var(--card-2)" }} />

          <span className="fl">Estilo visual</span>
          <div style={{ marginBottom: 14 }}>
            <ArtStylePicker value={artStyle} onChange={setArtStyle} />
          </div>

          <FieldWithAi
            label="Prompt da imagem"
            hint="Escreva como imagina a cena. A IA aprimora o texto aqui mesmo, no campo abaixo."
            value={coverPrompt}
            onChange={setCoverPrompt}
            placeholder="Descreva cores, elementos e clima da arte… ou deixe em branco e use só o estilo visual."
            rows={4}
            loading={genPrompt}
            onGenerate={generateProPrompt}
            generateLabel="Aprimorar prompt com IA"
            generateAgainLabel="Aprimorar novamente com IA"
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "11px 14px", borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
            <div style={{ paddingRight: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Incluir informações na arte</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Data, horário e local impressos na imagem</div>
            </div>
            <Toggle on={includeInfo} onChange={setIncludeInfo} />
          </div>

          <button type="button" className="btn btn-dark" style={{ width: "100%", marginTop: 14 }} onClick={generateImage} disabled={imgState === "loading"}>
            <Icon name="image" size={15} />
            {imgState === "loading" ? "Desenhando…" : imgState === "done" ? "Explorar outro estilo" : "Gerar convite com IA"}
          </button>
          {!quota.canGenerate && imgState !== "loading" ? (
            <p className="mono" style={{ marginTop: 10, fontSize: 9.5, textAlign: "center", color: "var(--muted)" }}>
              Sua versão gratuita já foi usada nesta conta · explore pacotes para novas tentativas criativas
            </p>
          ) : quota.accountPoolRemaining != null && quota.accountPoolRemaining > 0 ? (
            <p className="mono" style={{ marginTop: 10, fontSize: 9.5, textAlign: "center", color: "var(--muted)" }}>
              {quota.remainingGenerations} tentativa{quota.remainingGenerations === 1 ? "" : "s"} neste evento · {quota.accountPoolRemaining} na conta
            </p>
          ) : null}
        </div>
        </>
        ) : (
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="image" size={17} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Imagem do convite</strong>
          </div>

          {coverUrl ? (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "var(--card-2)",
                  border: "1px solid var(--line)"
                }}
              >
                <div style={{ width: 40, height: 56, borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{coverFileName || "Convite enviado"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>JPG, PNG ou WebP · até 5 MB</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCoverUrl("");
                    onCoverChange("");
                    setCoverFileName("");
                    setImgState("empty");
                  }}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--faint)", padding: 4 }}
                >
                  <Icon name="x" size={17} />
                </button>
              </div>
              <label className="btn btn-sm" style={{ width: "100%", textAlign: "center", cursor: uploadingCover ? "wait" : "pointer" }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploadingCover} onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                {uploadingCover ? "Enviando…" : "Trocar imagem"}
              </label>
            </>
          ) : (
            <label
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                cursor: uploadingCover ? "wait" : "pointer",
                textAlign: "left",
                background: "#fff",
                border: "1.5px dashed var(--line-2)",
                opacity: uploadingCover ? 0.65 : 1
              }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploadingCover} onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--card-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--coral-deep)" }}>
                <Icon name="image" size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                  {uploadingCover ? "Enviando convite…" : "Enviar imagem do convite"}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>JPG, PNG ou WebP · arraste ou clique · até 5 MB</span>
              </span>
              {!uploadingCover ? <Icon name="plus" size={17} style={{ color: "var(--muted)" }} /> : null}
            </label>
          )}
        </div>
        )}

        {/* 3 — Texto enviado com o convite */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="msg" size={17} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Texto enviado com o convite</strong>
          </div>

          <FieldWithAi
            label="Mensagem do convite"
            hint="Este texto acompanha o link do convite no WhatsApp e na página do evento."
            value={inviteText}
            onChange={setInviteText}
            onBlur={saveCopy}
            placeholder="Escreva sua ideia ou rascunho… A IA aprimora o texto aqui mesmo, substituindo o que você escreveu."
            rows={5}
            loading={genText}
            onGenerate={generateText}
            generateLabel="Aprimorar texto com IA"
            generateAgainLabel="Aprimorar novamente com IA"
            disabled={!textQuota.canGenerate}
          />
        </div>

        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13, marginTop: 12 }}>{error}</p> : null}
      </div>

      <div className="invite-art-preview" style={{ position: "sticky", top: 0 }}>
        <Mono style={{ display: "block", marginBottom: 10 }}>Prévia do convite</Mono>
        {previewBusy ? (
          <div
            className="stripe"
            style={{
              aspectRatio: "9 / 16",
              borderRadius: 14,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 24,
              textAlign: "center"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "3px solid var(--line)",
                borderTopColor: "var(--coral)",
                animation: "cover-gen-spin 0.9s linear infinite"
              }}
            />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
              {isAiMode ? "Criando seu convite com IA…" : "Enviando sua imagem…"}
            </p>
            {isAiMode ? (
              <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.45, maxWidth: 220 }}>
                Pode levar até 4 minutos. Veja o painel de progresso — não feche nem atualize a página.
              </p>
            ) : null}
          </div>
        ) : (
          <InviteArt
            title={event.title}
            themeLabel={event.theme}
            dateShort={formatEventDateLine(event.date) ?? event.date}
            time={formatTimeShort(event.startsAt)}
            place={placeLabel(event)}
            info={isAiMode ? includeInfo : false}
            photo={isAiMode ? previewPhoto : null}
            coverUrl={previewCoverUrl || undefined}
          />
        )}
        {coverUrl && !previewBusy ? (
          <>
            {pendingUrls.length > 1 ? (
              <div className="invite-cover-version-rail">
                <button type="button" className="nav" onClick={() => scrollVersions(-1)} aria-label="Versão anterior">
                  ‹
                </button>
                <div className="invite-cover-version-track" ref={versionTrackRef}>
                  {pendingUrls.map((url) => (
                    <button
                      key={url}
                      type="button"
                      className={`invite-cover-version-thumb${coverUrl === url ? " is-active" : ""}`}
                      onClick={() => selectVersion(url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Versão do convite" />
                    </button>
                  ))}
                </div>
                <button type="button" className="nav" onClick={() => scrollVersions(1)} aria-label="Próxima versão">
                  ›
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-sm"
              style={{ width: "100%", marginTop: 12 }}
              onClick={downloadCover}
              disabled={downloading}
            >
              <Icon name="download" size={15} />
              {downloading ? "Baixando…" : "Baixar versão selecionada"}
            </button>
          </>
        ) : null}
        {quota.familyPoolTotal ? (
          <div className="invite-ai-quota-note">
            Cápsula Plus: {quota.familyPoolUsed ?? 0}/{quota.familyPoolTotal} versões usadas no ano · até {quota.familyPerEventMax} por evento.
          </div>
        ) : null}
        {isAiMode && !includeInfo ? (
          <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4 }}>
            Sem os detalhes na arte — data, horário e local aparecem na página do convite.
          </p>
        ) : null}
        {!isAiMode && !coverUrl && !previewBusy ? (
          <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4 }}>
            Envie a imagem do convite para ver a prévia aqui.
          </p>
        ) : null}
      </div>

      <CoverGenerationOverlay
        active={isAiMode && imgState === "loading"}
        capsuleActive={Boolean(event.capsuleActivatedAt)}
        composingWithBgRemoval={removeBackground && Boolean(photoUrl)}
      />

      <InviteAiUpgradeModal
        open={showUpgradeModal}
        eventId={event.id}
        source={upgradeSource}
        onClose={() => setShowUpgradeModal(false)}
        onPurchased={(nextQuota) => setQuota(nextQuota)}
      />
    </div>
  );
}
