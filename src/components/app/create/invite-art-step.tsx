"use client";

import { useState } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { ArtStylePicker } from "@/components/app/ui/art-style-picker";
import { Icon } from "@/components/app/ui/icon";
import { InviteArt } from "@/components/app/ui/invite-art";
import { Mono, Segmented, Shimmer, Tag, Toggle } from "@/components/app/ui/primitives";
import { Spinner } from "@/components/app/ui/spinner";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import type { TextQuota } from "@/components/dashboard/invite-text-editor";
import { generateEventCoverImageClient } from "@/lib/api/generate-cover";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { composeCoverWithHostPhoto, uploadComposedCover } from "@/lib/images/compose-cover-with-photo";
import { buildPhotoZoneInstructions, type PhotoOverlayConfig, type PhotoShape, type PhotoSize } from "@/lib/images/photo-zone-instructions";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { resolveInviteCopy } from "@/lib/events/invite-copy";
import { artStylePrompt, type ArtStyle } from "@/lib/openai/art-styles";
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
  const [removeBackground, setRemoveBackground] = useState(false);
  const [photoNotes, setPhotoNotes] = useState("");
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
        removeBackground,
        notes: photoNotes.trim() || undefined
      }
    : null;

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
          draftPhotoInstructions: photo ? buildPhotoZoneInstructions(photo) : "",
          withHostPhoto: false,
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
      const orientation = coverPrompt.trim()
        ? `${coverPrompt.trim()}. ${artStylePrompt(artStyle)}.`
        : artStylePrompt(artStyle);
      const result = await generateEventCoverImageClient({
        eventId: event.id,
        mode: "generate",
        orientation,
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
        setCoverComposed(false);
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
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 26, alignItems: "start" }}>
      <div>
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
                  onChange={(shape) => {
                    setPhotoShape(shape);
                    setCoverComposed(false);
                  }}
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
                    <div style={{ fontWeight: 600, fontSize: 12.5 }}>Remover fundo da foto do homenageado</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.45 }}>
                      Tira o fundo feio da foto enviada e deixa só a pessoa integrada à arte do convite. A arte gerada pela IA não é alterada.
                    </div>
                  </div>
                  <Toggle
                    on={removeBackground}
                    onChange={(on) => {
                      setRemoveBackground(on);
                      setCoverComposed(false);
                    }}
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
                      onChange={(e) => {
                        setPhotoNotes(e.target.value);
                        setCoverComposed(false);
                      }}
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
