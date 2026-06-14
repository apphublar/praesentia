"use client";

import { useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { InviteArt, type ArtStyle } from "@/components/app/ui/invite-art";
import { Mono, Segmented, Shimmer, Tag, Toggle } from "@/components/app/ui/primitives";
import { Spinner } from "@/components/app/ui/spinner";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import type { TextQuota } from "@/components/dashboard/invite-text-editor";
import { generateEventCoverImageClient } from "@/lib/api/generate-cover";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { composeCoverWithHostPhoto, uploadComposedCover } from "@/lib/images/compose-cover-with-photo";
import { buildPhotoZoneInstructions, type PhotoOverlayConfig, type PhotoSize } from "@/lib/images/photo-zone-instructions";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { resolveInviteCopy } from "@/lib/events/invite-copy";
import { buildInitialCoverEditableFields, coverEditableFieldsToOverride, toCoverFormEventInput } from "@/lib/openai/cover-invitation-spec";
import { resizeImageForCover } from "@/lib/images/resize-host-photo";

const PHOTO_POSITIONS = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"] as const;

function formatTimeShort(time: string) {
  const [h, m] = time.split(":");
  return `${h}h${m === "00" ? "" : m}`;
}

function placeLabel(event: Event) {
  if (event.venueName === "Local a definir") return "Local a definir";
  if (event.eventFormat === "online") return "Evento online";
  return event.venueName;
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
  const [tone, setTone] = useState("Carinhoso e poético, com toque de jardim encantado");
  const [genText, setGenText] = useState(false);
  const [inviteText, setInviteText] = useState("");
  const [artStyle, setArtStyle] = useState<ArtStyle>("Jardim");
  const [artDesc, setArtDesc] = useState("");
  const [proPrompt, setProPrompt] = useState("");
  const [genPrompt, setGenPrompt] = useState(false);
  const [includeInfo, setIncludeInfo] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(event.hostPhotoUrl ?? "");
  const [photoName, setPhotoName] = useState("");
  const [photoShape, setPhotoShape] = useState<"round" | "square" | "cutout">("round");
  const [photoPos, setPhotoPos] = useState<(typeof PHOTO_POSITIONS)[number]>("br");
  const [photoSize, setPhotoSize] = useState<PhotoSize>("md");
  const [removeBackground, setRemoveBackground] = useState(false);
  const [coverComposed, setCoverComposed] = useState(false);
  const [imgState, setImgState] = useState<"empty" | "loading" | "done">(event.coverImageUrl ? "done" : "empty");
  const [coverUrl, setCoverUrl] = useState(event.coverImageUrl ?? "");
  const [error, setError] = useState("");

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

  const photo: PhotoOverlayConfig | null = photoUrl
    ? {
        imageUrl: photoUrl,
        shape: photoShape,
        pos: photoPos,
        size: photoSize,
        removeBackground: removeBackground || photoShape === "cutout"
      }
    : null;

  async function generateText() {
    setGenText(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/generate-invite-text`, {
        method: "POST",
        body: JSON.stringify({ mode: "generate", editHint: tone })
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
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/generate-cover-prompt`, {
        method: "POST",
        body: JSON.stringify({
          draftOrientation: `${artDesc}. Estilo ${artStyle}. ${tone}`,
          draftPhotoInstructions: photo ? buildPhotoZoneInstructions(photo) : "",
          withHostPhoto: false,
          coverFields: coverEditableFieldsToOverride(coverFields)
        })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Não consegui gerar o prompt."));
        return;
      }
      setProPrompt(String(data.visualDirection ?? data.prompt ?? ""));
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setGenPrompt(false);
    }
  }

  async function generateImage() {
    setImgState("loading");
    setCoverComposed(false);
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
      const result = await generateEventCoverImageClient({
        eventId: event.id,
        mode: "generate",
        orientation: proPrompt || `${artDesc}. Estilo ${artStyle} em tons pastel.`,
        photoInstructions: photo ? buildPhotoZoneInstructions(photo) : undefined,
        externalPhotoCompose: hasPhoto,
        coverFields: coverEditableFieldsToOverride(fields)
      });
      if (result.error) {
        setError(result.error);
        setImgState(coverUrl ? "done" : "empty");
        return;
      }
      let finalUrl = result.coverImageUrl;
      if (finalUrl && photo) {
        try {
          const blob = await composeCoverWithHostPhoto(finalUrl, photo);
          finalUrl = await uploadComposedCover(event.id, blob);
          setCoverComposed(true);
        } catch (composeError) {
          console.warn("[invite-art] compose cover", composeError);
          setError("Arte gerada, mas não foi possível aplicar a foto. Tente gerar novamente.");
        }
      }
      if (finalUrl) {
        setCoverUrl(finalUrl);
        onCoverChange(finalUrl);
        setImgState("done");
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
      setImgState(coverUrl ? "done" : "empty");
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
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    }
  }

  async function saveCopy() {
    const copy = resolveInviteCopy({
      headline: event.title,
      message: inviteText,
      whatsapp: `Você está convidado(a) para ${event.title}. Confirme aqui: {{link}}`,
      hashtags: []
    });
    await dashboardFetchJson(`/api/events/${event.id}/invite-copy`, {
      method: "PATCH",
      body: JSON.stringify({ inviteCopy: copy })
    });
    onCopyChange(copy);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 26, alignItems: "start" }}>
      <div>
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="spark" size={17} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Texto com IA</strong>
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Descreva o tom: carinhoso, divertido, formal…"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          />
          <button type="button" className="btn btn-dark btn-sm" style={{ marginTop: 12 }} onClick={generateText} disabled={genText || !textQuota.canGenerate}>
            <Icon name="spark" size={14} />
            {genText ? "Gerando…" : inviteText ? "Gerar novamente" : "Gerar texto"}
          </button>
          {genText || inviteText ? (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)", minHeight: 70 }}>
              {genText ? (
                <Shimmer lines={3} />
              ) : (
                <textarea
                  className="input"
                  rows={5}
                  value={inviteText}
                  onChange={(e) => setInviteText(e.target.value)}
                  onBlur={saveCopy}
                  style={{ background: "transparent", border: "none", padding: 0 }}
                />
              )}
            </div>
          ) : null}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="image" size={17} style={{ color: "var(--coral)" }} />
              <strong style={{ fontSize: 14 }}>Arte com IA</strong>
            </div>
            <Tag>1 grátis</Tag>
          </div>

          <span className="fl">Tema da festa</span>
          <input className="input" value={event.theme} readOnly style={{ marginBottom: 14, background: "var(--card-2)" }} />

          <span className="fl">
            Foto do homenageado <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--faint)" }}>· opcional</span>
          </span>
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
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Ajuste o formato e a posição abaixo</div>
                </div>
                <button type="button" onClick={() => setPhotoUrl("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--faint)", padding: 4 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              <div style={{ marginBottom: 14, padding: 14, borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
                <span className="fl">Formato da foto</span>
                <Segmented
                  full
                  value={photoShape}
                  onChange={(shape) => {
                    setPhotoShape(shape);
                    if (shape === "cutout") setRemoveBackground(true);
                    setCoverComposed(false);
                  }}
                  options={[
                    { v: "round" as const, l: "Redonda" },
                    { v: "square" as const, l: "Quadrada" },
                    { v: "cutout" as const, l: "Recortada" }
                  ]}
                />
                <span className="fl" style={{ marginTop: 14 }}>
                  Tamanho da foto
                </span>
                <Segmented
                  full
                  value={photoSize}
                  onChange={(size) => {
                    setPhotoSize(size);
                    setCoverComposed(false);
                  }}
                  options={[
                    { v: "sm" as const, l: "Pequena" },
                    { v: "md" as const, l: "Média" },
                    { v: "lg" as const, l: "Grande" },
                    { v: "xl" as const, l: "Extra" }
                  ]}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "#fff", border: "1px solid var(--line)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>Remover fundo da foto</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {photoShape === "cutout"
                        ? "Obrigatório no formato recortado"
                        : "A pessoa entra integrada à arte — sem fundo quadriculado no convite final"}
                    </div>
                  </div>
                  <Toggle
                    on={removeBackground || photoShape === "cutout"}
                    onChange={(on) => {
                      if (photoShape !== "cutout") setRemoveBackground(on);
                      setCoverComposed(false);
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 14 }}>
                  <div>
                    <span className="fl">Posição na arte</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, width: 104 }}>
                      {PHOTO_POSITIONS.map((p) => {
                        const on = photoPos === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setPhotoPos(p);
                              setCoverComposed(false);
                            }}
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
                                borderRadius: photoShape === "square" ? 2 : photoShape === "cutout" ? "40%" : 99
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ flex: 1, paddingTop: 18 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
                      <Icon name="spark" size={13} style={{ color: "var(--coral)", verticalAlign: "-2px", marginRight: 4 }} />
                      A IA cria título e elementos integrados à foto — podem passar sobre o corpo, sem tampar o rosto.
                    </p>
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
                marginBottom: 14,
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

          <span className="fl">Como você imagina a arte?</span>
          <textarea className="input" rows={3} value={artDesc} onChange={(e) => setArtDesc(e.target.value)} placeholder="Descreva a cena, cores e elementos…" style={{ marginBottom: 14 }} />

          <span className="fl">Estilo visual</span>
          <div style={{ marginBottom: 14 }}>
            <Segmented full options={["Jardim", "Aquarela", "Minimal", "Festa"]} value={artStyle} onChange={(v) => setArtStyle(v as ArtStyle)} />
          </div>

          <button type="button" className="btn btn-ghost btn-sm" style={{ width: "100%" }} onClick={generateProPrompt} disabled={genPrompt}>
            <Icon name="spark" size={14} />
            {genPrompt ? "Escrevendo…" : proPrompt ? "Refazer prompt" : "Gerar prompt profissional com IA"}
          </button>

          {genPrompt || proPrompt ? (
            <div style={{ marginTop: 12 }}>
              <span className="fl" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Prompt da imagem (editável)</span>
                {proPrompt ? (
                  <span className="mono" style={{ fontSize: 8.5, color: "var(--coral-deep)" }}>
                    otimizado ✦
                  </span>
                ) : null}
              </span>
              {genPrompt ? (
                <div style={{ padding: 14, borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
                  <Shimmer lines={3} />
                </div>
              ) : (
                <textarea className="input" rows={4} value={proPrompt} onChange={(e) => setProPrompt(e.target.value)} style={{ fontSize: 13, lineHeight: 1.5, background: "var(--card-2)" }} />
              )}
            </div>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "11px 14px", borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
            <div style={{ paddingRight: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Incluir informações na arte</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Data, horário e local impressos na imagem</div>
            </div>
            <Toggle on={includeInfo} onChange={setIncludeInfo} />
          </div>

          <button type="button" className="btn btn-dark" style={{ width: "100%", marginTop: 14 }} onClick={generateImage} disabled={imgState === "loading" || !coverQuota.canGenerate}>
            <Icon name="image" size={15} />
            {imgState === "loading" ? "Desenhando…" : imgState === "done" ? "Gerar outra arte" : "Gerar imagem"}
          </button>
          {imgState === "done" ? (
            <p className="mono" style={{ marginTop: 10, fontSize: 9.5, textAlign: "center" }}>
              1ª arte grátis usada · próximas: pacote +3 por R$9
            </p>
          ) : null}
        </div>
        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13, marginTop: 12 }}>{error}</p> : null}
      </div>

      <div style={{ position: "sticky", top: 0 }}>
        <Mono style={{ display: "block", marginBottom: 10 }}>Prévia do convite</Mono>
        {imgState === "loading" ? (
          <div className="stripe" style={{ aspectRatio: "9 / 16", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </div>
        ) : (
          <InviteArt
            title={event.title}
            themeLabel={event.theme}
            dateShort={formatEventDateLine(event.date) ?? event.date}
            time={formatTimeShort(event.startsAt)}
            place={placeLabel(event)}
            artStyle={artStyle}
            info={includeInfo}
            photo={coverComposed ? null : photo}
            coverUrl={coverUrl || undefined}
          />
        )}
        {!includeInfo ? (
          <p style={{ margin: "10px 2px 0", fontSize: 11.5, color: "var(--muted)", lineHeight: 1.4 }}>
            Sem os detalhes na arte — data, horário e local aparecem na página do convite.
          </p>
        ) : null}
      </div>
    </div>
  );
}
