"use client";

import { useEffect, useImperativeHandle, useRef, useState, forwardRef, type ReactNode } from "react";
import type { Event, InviteCopy } from "@/types/domain";
import { ArtStylePicker } from "@/components/app/ui/art-style-picker";
import { Icon } from "@/components/app/ui/icon";
import { InviteArt } from "@/components/app/ui/invite-art";
import { InviteAiUpgradeModal } from "@/components/app/invite-ai-upgrade-modal";
import { InviteArtApprovalModal } from "@/components/app/create/invite-art-approval-modal";
import { Mono, Segmented, Shimmer, Tag, Toggle } from "@/components/app/ui/primitives";
import { CoverGenerationOverlay } from "@/components/dashboard/cover-generation-overlay";
import type { CoverQuota } from "@/components/dashboard/cover-generator";
import type { TextQuota } from "@/components/dashboard/invite-text-editor";
import { generateEventCoverImageClient, fetchCoverGenerationStatus, resumeCoverGenerationClient, selectCoverVersionClient } from "@/lib/api/generate-cover";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import {
  loadInviteArtDraft,
  loadPendingCoverArtifact,
  saveInviteArtDraft,
  savePendingCoverArtifact
} from "@/lib/create/invite-art-draft";
import { shouldPromptCoverUpgrade } from "@/lib/plans/cover-upgrade-prompt";
import { downloadCoverImage } from "@/lib/images/download-cover-image";
import { buildPhotoZoneInstructions, type PhotoOverlayConfig, type PhotoShape, type PhotoSize } from "@/lib/images/photo-zone-instructions";
import { formatEventDateLine } from "@/lib/events/format-event-date";
import { resolveInviteCopy } from "@/lib/events/invite-copy";
import { artStylePrompt, type ArtStyle } from "@/lib/openai/art-styles";
import { buildInitialCoverEditableFields, coverEditableFieldsToOverride, toCoverFormEventInput, withoutCoverInfoFields } from "@/lib/openai/cover-invitation-spec";
import { resizeImageForCover, urlToDataUrlForCover } from "@/lib/images/resize-host-photo";
import {
  inviteArtContinueBlockedMessage,
  inviteArtStepIndex,
  inviteArtStepLabel,
  inviteArtSteps,
  useCompactInviteLayout,
  type InviteArtContinueResult,
  type InviteArtSubStep
} from "@/lib/create/invite-art-flow";

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

/** Fora de InviteArtStep — componente interno remonta inputs e perde foco a cada tecla. */
function InviteArtSubStepShell({
  step,
  currentStep,
  visible,
  children
}: {
  step: InviteArtSubStep;
  currentStep: InviteArtSubStep;
  visible: boolean;
  children: ReactNode;
}) {
  if (!visible) return null;
  return (
    <div className={`invite-art-substep${currentStep === step ? " is-current" : ""}`} data-step={step}>
      {children}
    </div>
  );
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

export type InviteArtStepHandle = {
  tryContinue: () => InviteArtContinueResult;
  tryBack: () => boolean;
};

function InviteModeDemo({ mode }: { mode: InviteCoverMode }) {
  return (
    <div className="invite-mode-demo" aria-hidden="true">
      <div className={`invite-mode-demo-panel${mode === "ai" ? " is-active" : ""}`}>
        <span className="invite-mode-demo-icon">
          <Icon name="spark" size={18} />
        </span>
        <strong>Criar com IA</strong>
        <p>Descreva a cena e a Praesentia gera a arte do convite para você.</p>
        <div className="invite-mode-demo-mock invite-mode-demo-mock--ai">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className={`invite-mode-demo-panel${mode === "custom" ? " is-active" : ""}`}>
        <span className="invite-mode-demo-icon">
          <Icon name="image" size={18} />
        </span>
        <strong>Enviar imagem</strong>
        <p>Faça upload do convite que você já preparou no celular ou no computador.</p>
        <div className="invite-mode-demo-mock invite-mode-demo-mock--upload">
          <Icon name="plus" size={16} />
          <span>Upload</span>
        </div>
      </div>
    </div>
  );
}

export const InviteArtStep = forwardRef<
  InviteArtStepHandle,
  {
    event: Event;
    textQuota: TextQuota;
    coverQuota: CoverQuota;
    onCoverChange: (url: string) => void;
    onCopyChange: (copy: InviteCopy) => void;
    onReadyChange?: (ready: boolean) => void;
    onNavStateChange?: (state: { canContinue: boolean; continueHint?: string; blockedMessage?: string }) => void;
  }
>(function InviteArtStep(
  { event, textQuota, coverQuota, onCoverChange, onCopyChange, onReadyChange, onNavStateChange },
  ref
) {
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
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
  const isCompact = useCompactInviteLayout();
  const [subStep, setSubStep] = useState<InviteArtSubStep>("mode");
  const [photoChoice, setPhotoChoice] = useState<"include" | "skip" | null>(null);
  const [artApproved, setArtApproved] = useState(Boolean(event.coverImageUrl));
  const [showArtApproval, setShowArtApproval] = useState(false);
  const [promptEnhancedByAi, setPromptEnhancedByAi] = useState(false);
  const [themeDraft, setThemeDraft] = useState(event.theme);
  const [themeEditing, setThemeEditing] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [resumeMessage, setResumeMessage] = useState("");

  useEffect(() => {
    const draft = loadInviteArtDraft(event.id);
    if (!draft) return;
    setCoverMode(draft.coverMode);
    setSubStep(draft.subStep);
    setArtStyle(draft.artStyle);
    setCoverPrompt(draft.coverPrompt);
    setPromptEnhancedByAi(draft.promptEnhancedByAi);
    setIncludeInfo(draft.includeInfo);
    if (draft.inviteText.trim()) setInviteText(draft.inviteText);
    setPhotoChoice(draft.photoChoice);
    setPhotoShape(draft.photoShape);
    setPhotoPos(draft.photoPos as (typeof PHOTO_POSITIONS)[number]);
    setPhotoSize(draft.photoSize);
    setRemoveBackground(draft.removeBackground);
    setPhotoNotes(draft.photoNotes);
    if (!event.coverImageUrl) setArtApproved(draft.artApproved);
  }, [event.id, event.coverImageUrl]);

  useEffect(() => {
    saveInviteArtDraft(event.id, {
      coverMode,
      subStep,
      artStyle,
      coverPrompt,
      promptEnhancedByAi,
      includeInfo,
      inviteText,
      photoChoice,
      photoShape,
      photoPos,
      photoSize,
      removeBackground,
      photoNotes,
      artApproved
    });
  }, [
    event.id,
    coverMode,
    subStep,
    artStyle,
    coverPrompt,
    promptEnhancedByAi,
    includeInfo,
    inviteText,
    photoChoice,
    photoShape,
    photoPos,
    photoSize,
    removeBackground,
    photoNotes,
    artApproved
  ]);

  function applyCoverGenerationResult(result: {
    coverImageUrl?: string;
    pendingUrls?: string[];
    quota?: CoverQuota;
    status?: string;
    error?: string;
    needsUpgrade?: boolean;
  }) {
    if (result.status === "processing") {
      setResumeMessage(result.error ?? "Sua imagem ainda está sendo criada. Volte em instantes.");
      setImgState("loading");
      return false;
    }
    setResumeMessage("");
    if (result.error) {
      const promptUpgrade = result.needsUpgrade || shouldPromptCoverUpgrade(result.error);
      if (promptUpgrade) {
        setUpgradeSource("retry_without_pack");
        setShowUpgradeModal(true);
      }
      setError(result.error);
      setImgState(coverUrl ? "done" : "empty");
      return false;
    }
    const finalUrl = result.coverImageUrl;
    if (!finalUrl) return false;
    if (Array.isArray(result.pendingUrls)) {
      setPendingUrls(result.pendingUrls);
    } else if (quota.showVersionCarousel) {
      setPendingUrls((current) => [...current, finalUrl].slice(-(quota.perEventMax ?? 3)));
    }
    if (result.quota) setQuota(result.quota);
    setCoverUrl(finalUrl);
    onCoverChange(finalUrl);
    setImgState("done");
    setArtApproved(false);
    setShowArtApproval(true);
    return true;
  }

  useEffect(() => {
    if (event.coverImageUrl && artApproved) return;

    let cancelled = false;

    async function tryResume() {
      let artifactId = loadPendingCoverArtifact(event.id);
      if (!artifactId) {
        try {
          const status = await fetchCoverGenerationStatus(event.id);
          if (status.status === "processing" && status.artifactId) {
            artifactId = status.artifactId;
            savePendingCoverArtifact(event.id, artifactId);
          } else if (status.status === "completed" && status.coverImageUrl) {
            applyCoverGenerationResult({
              status: "completed",
              coverImageUrl: status.coverImageUrl,
              pendingUrls: status.pendingUrls,
              quota: status.quota
            });
            return;
          }
        } catch {
          return;
        }
      }
      if (!artifactId || cancelled) return;

      setImgState("loading");
      setResumeMessage("Retomando a criação da sua imagem…");
      const result = await resumeCoverGenerationClient(event.id, artifactId);
      if (!cancelled) applyCoverGenerationResult(result);
    }

    void tryResume();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const flowSteps = inviteArtSteps(coverMode);
  const isAiMode = coverMode === "ai";
  const previewBusy = isAiMode ? imgState === "loading" : uploadingCover;
  const promptReady = coverPrompt.trim().length >= 50 || promptEnhancedByAi;
  const canGenerateImage = promptReady && imgState !== "loading" && !genPrompt;

  function canAdvanceFromStep(step: InviteArtSubStep) {
    switch (step) {
      case "mode":
        return true;
      case "photo":
        if (photoChoice === null) return false;
        if (photoChoice === "skip") return isAiMode ? artApproved && Boolean(coverUrl) : true;
        return true;
      case "art":
        return isAiMode ? artApproved && Boolean(coverUrl) : Boolean(coverUrl);
      case "text":
        return Boolean(inviteText.trim());
    }
  }

  function isStepVisible(step: InviteArtSubStep) {
    if (step === "art" && isAiMode && photoChoice === "skip") return false;
    return subStep === step;
  }

  function goNextSubStep() {
    const idx = inviteArtStepIndex(flowSteps, subStep);
    if (idx >= flowSteps.length - 1 || !canAdvanceFromStep(subStep)) return;
    if (subStep === "photo" && photoChoice === "skip") {
      setSubStep("text");
      return;
    }
    setSubStep(flowSteps[idx + 1]!);
  }

  function goPrevSubStep() {
    const idx = inviteArtStepIndex(flowSteps, subStep);
    if (idx <= 0) return;
    if (subStep === "text" && isAiMode && photoChoice === "skip") {
      setSubStep("photo");
      return;
    }
    setSubStep(flowSteps[idx - 1]!);
  }

  const isLastSubStep = inviteArtStepIndex(flowSteps, subStep) === flowSteps.length - 1;
  const inviteReadyLocal =
    Boolean(inviteText.trim()) && (isAiMode ? artApproved && Boolean(coverUrl) : Boolean(coverUrl));
  const canExternalContinue = isLastSubStep ? inviteReadyLocal : canAdvanceFromStep(subStep);
  const showInvitePreview = subStep !== "mode";

  useImperativeHandle(
    ref,
    () => ({
      tryContinue: () => {
        if (!canAdvanceFromStep(subStep)) return "blocked";
        if (!isLastSubStep) {
          goNextSubStep();
          return "advanced";
        }
        return inviteReadyLocal ? "complete" : "blocked";
      },
      tryBack: () => {
        if (inviteArtStepIndex(flowSteps, subStep) <= 0) return false;
        goPrevSubStep();
        return true;
      }
    }),
    [subStep, flowSteps, photoChoice, artApproved, coverUrl, inviteText, isAiMode, isLastSubStep, inviteReadyLocal]
  );

  useEffect(() => {
    onNavStateChange?.({
      canContinue: canExternalContinue,
      continueHint:
        subStep === "mode"
          ? "Escolha como deseja criar a imagem e clique em Continuar para seguir com o convite."
          : undefined,
      blockedMessage: inviteArtContinueBlockedMessage(subStep, photoChoice)
    });
  }, [canExternalContinue, subStep, photoChoice, onNavStateChange]);

  useEffect(() => {
    if (!inviteText.trim()) return;
    onCopyChange(
      resolveInviteCopy({
        headline: event.title,
        message: inviteText,
        whatsapp: event.inviteCopy?.whatsapp ?? `Você está convidado(a) para ${event.title}. Confirme aqui: {{link}}`,
        hashtags: event.inviteCopy?.hashtags ?? []
      })
    );
  }, [inviteText, event.title, event.inviteCopy?.whatsapp, event.inviteCopy?.hashtags, onCopyChange]);

  useEffect(() => {
    const textReady = Boolean(inviteText.trim());
    const artReady = isAiMode ? artApproved && Boolean(coverUrl) : Boolean(coverUrl);
    onReadyChange?.(textReady && artReady);
  }, [inviteText, artApproved, coverUrl, isAiMode, onReadyChange]);

  useEffect(() => {
    const steps = inviteArtSteps(coverMode);
    if (!steps.includes(subStep)) setSubStep("mode");
  }, [coverMode, subStep]);

  async function saveTheme() {
    setSavingTheme(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({ details: { theme: themeDraft.trim() } })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar tema."));
      setThemeEditing(false);
    } catch (err) {
      setError(apiErrorMessage(err, "Falha ao salvar tema."));
    } finally {
      setSavingTheme(false);
    }
  }

  function handleApproveArt() {
    setArtApproved(true);
    setShowArtApproval(false);
  }

  function handleGenerateNew() {
    setShowArtApproval(false);
    void generateImage();
  }

  function handlePhotoSkip() {
    setPhotoChoice("skip");
    setPhotoUrl("");
    setPhotoName("");
  }

  function handlePhotoInclude() {
    setPhotoChoice("include");
  }

  const currentPhoto = photoUrl
    ? buildPhotoConfig({ photoUrl, photoShape, photoPos, photoSize, removeBackground, photoNotes })
    : null;

  const coverFields = buildInitialCoverEditableFields(
    toCoverFormEventInput({
      eventTitle: event.title,
      eventType: event.eventType,
      eventHostName: event.hostName,
      eventTheme: themeDraft,
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
          coverFields: coverEditableFieldsToOverride(includeInfo ? coverFields : withoutCoverInfoFields(coverFields))
        })
      });
      if (!response.ok) {
        setError(String(data.error ?? "Não consegui gerar o prompt."));
        return;
      }
      setCoverPrompt(String(data.visualDirection ?? data.prompt ?? ""));
      setPromptEnhancedByAi(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setGenPrompt(false);
    }
  }

  async function generateImage() {
    setError("");
    try {
      const liveStatus = await fetchCoverGenerationStatus(event.id);
      if (liveStatus.quota) setQuota(liveStatus.quota);

      if (liveStatus.status === "processing" && liveStatus.artifactId) {
        setImgState("loading");
        savePendingCoverArtifact(event.id, liveStatus.artifactId);
        const resumed = await resumeCoverGenerationClient(event.id, liveStatus.artifactId);
        applyCoverGenerationResult(resumed);
        return;
      }

      const activeQuota = liveStatus.quota ?? quota;
      if (!activeQuota.canGenerate) {
        setUpgradeSource("retry_without_pack");
        setShowUpgradeModal(true);
        return;
      }

    setImgState("loading");
      const fields = includeInfo ? coverFields : withoutCoverInfoFields(coverFields);
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
      const honoree = fields.hostName.trim();
      const genericHonoree = ["homenageado(a)", "homenageado", "homenageada", "responsável", "responsavel"];
      const honoreeHint =
        honoree && !genericHonoree.includes(honoree.toLowerCase()) && !event.title.toLowerCase().includes(honoree.toLowerCase())
          ? `Destaque o nome "${honoree}" na composição. `
          : "";
      const orientation = coverPrompt.trim()
        ? `${honoreeHint}${coverPrompt.trim()}. ${artStylePrompt(artStyle)}.`
        : `${honoreeHint}${artStylePrompt(artStyle)}`;
      const result = await generateEventCoverImageClient({
        eventId: event.id,
        mode: "generate",
        orientation,
        photoInstructions: photoConfig ? buildPhotoZoneInstructions(photoConfig) : undefined,
        primaryPhotoDataUrl,
        coverFields: coverEditableFieldsToOverride(fields)
      });
      applyCoverGenerationResult(result);
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
        setArtApproved(true);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Erro de conexão."));
    } finally {
      setUploadingCover(false);
    }
  }

  async function uploadPhoto(file: File) {
    const localPreview = URL.createObjectURL(file);
    setUploadingPhoto(true);
    setPhotoPreviewUrl(localPreview);
    setPhotoName(file.name);
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
    } finally {
      URL.revokeObjectURL(localPreview);
      setPhotoPreviewUrl("");
      setUploadingPhoto(false);
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
    <div className={`invite-art-grid${showInvitePreview ? "" : " invite-art-grid--no-preview"}`}>
      <div className="invite-art-main">
        {isCompact ? (
          <div className="invite-art-substep-indicator">
            <Mono>
              {inviteArtStepIndex(flowSteps, subStep) + 1}/{flowSteps.length} · {inviteArtStepLabel(subStep)}
            </Mono>
          </div>
        ) : null}

        <InviteArtSubStepShell step="mode" currentStep={subStep} visible={isStepVisible("mode")}>
        <div className="card invite-mode-card" style={{ padding: 16, marginBottom: 18 }}>
          <span className="fl">Como você quer a imagem do convite?</span>
          <Segmented
            full
            value={coverMode}
            onChange={(mode) => {
              setCoverMode(mode);
              setSubStep("mode");
              setArtApproved(mode === "custom" ? Boolean(coverUrl) : false);
              setPhotoChoice(null);
            }}
            options={[
              { v: "ai" as const, l: "Criar minha imagem" },
              { v: "custom" as const, l: "Enviar minha imagem" }
            ]}
          />
          <InviteModeDemo mode={coverMode} />
        </div>
        {subStep === "mode" ? (
          <p className="invite-art-continue-hint">
            Escolha como deseja criar a imagem e clique em <strong>Continuar</strong> para seguir com o convite.
          </p>
        ) : null}
        </InviteArtSubStepShell>

        {isAiMode ? (
        <>
        <InviteArtSubStepShell step="photo" currentStep={subStep} visible={isStepVisible("photo")}>
        {/* 1 — Foto do homenageado */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="user" size={17} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Foto do homenageado</strong>
          </div>

          <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
            Deseja incluir a foto do homenageado na arte do convite?
          </p>
          <div className="invite-photo-choice-grid">
            <button
              type="button"
              className={`btn btn-sm${photoChoice === "include" ? " btn-dark" : " btn-ghost"}`}
              onClick={handlePhotoInclude}
            >
              Sim, incluir foto
            </button>
            <button
              type="button"
              className={`btn btn-sm${photoChoice === "skip" ? " btn-dark" : " btn-ghost"}`}
              onClick={handlePhotoSkip}
            >
              Não incluir
            </button>
          </div>

          {photoChoice === "include" ? (
            <div style={{ marginTop: 14 }}>
            {photoUrl || uploadingPhoto ? (
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
                <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid #fff", boxShadow: "0 2px 6px -2px rgba(0,0,0,.3)", aspectRatio: "1 / 1" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl || photoPreviewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{photoName || "Foto enviada"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {uploadingPhoto ? "Enviando e processando foto..." : "Ajuste formato, tamanho e posição"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={uploadingPhoto}
                  onClick={() => setPhotoUrl("")}
                  style={{ border: "none", background: "transparent", cursor: uploadingPhoto ? "wait" : "pointer", color: "var(--faint)", padding: 4 }}
                >
                  <Icon name="x" size={17} />
                </button>
              </div>
              {uploadingPhoto ? (
                <div className="invite-photo-upload-progress">
                  <span className="invite-photo-upload-spinner" aria-hidden="true" />
                  <p>
                    Foto anexada. Estamos processando para aplicar no convite...
                  </p>
                </div>
              ) : null}
              <div className="invite-photo-settings">
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
                <div className="invite-photo-bg-toggle">
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
                <div className="invite-photo-layout">
                  <div className="invite-photo-position">
                    <span className="fl">Posição da foto</span>
                    <div className="invite-photo-position-grid">
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
                  <div className="invite-photo-notes">
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
                border: "1.5px dashed var(--line-2)",
                opacity: uploadingPhoto ? 0.7 : 1
              }}
            >
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploadingPhoto} onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--card-2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--coral-deep)" }}>
                <Icon name="image" size={18} />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>
                  {uploadingPhoto ? "Processando foto..." : "Adicionar foto do homenageado"}
                </span>
                <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)" }}>
                  {uploadingPhoto ? "Aguarde alguns segundos" : "JPG ou PNG · arraste ou clique"}
                </span>
              </span>
              {!uploadingPhoto ? <Icon name="plus" size={17} style={{ color: "var(--muted)" }} /> : null}
            </label>
            )}
            </div>
          ) : null}

          {photoChoice === "skip" ? (
            <div className="invite-photo-inline-art">
              <div className="invite-photo-inline-divider" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="image" size={17} style={{ color: "var(--coral)" }} />
                  <strong style={{ fontSize: 14 }}>Arte do convite</strong>
                </div>
                <Tag>1 grátis</Tag>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                <span className="fl" style={{ marginBottom: 0 }}>Tema da festa</span>
                {!themeEditing ? (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setThemeEditing(true)}>
                    Editar
                  </button>
                ) : null}
              </div>
              {themeEditing ? (
                <div style={{ marginBottom: 14 }}>
                  <input className="input" value={themeDraft} onChange={(e) => setThemeDraft(e.target.value)} style={{ marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="btn btn-dark btn-sm" disabled={savingTheme} onClick={() => void saveTheme()}>
                      {savingTheme ? "Salvando…" : "Salvar tema"}
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setThemeDraft(event.theme); setThemeEditing(false); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <input className="input" value={themeDraft} readOnly style={{ marginBottom: 14, background: "var(--card-2)" }} />
              )}

              <span className="fl">Estilo visual</span>
              <div style={{ marginBottom: 14 }}>
                <ArtStylePicker value={artStyle} onChange={setArtStyle} />
              </div>

              <FieldWithAi
                label="Prompt da imagem"
                hint="Escreva como imagina a cena (mínimo 50 caracteres) ou use Aprimorar prompt com IA."
                value={coverPrompt}
                onChange={(value) => {
                  setCoverPrompt(value);
                  if (value.trim().length >= 50) setPromptEnhancedByAi(false);
                }}
                placeholder="Descreva cores, elementos e clima da arte…"
                rows={4}
                loading={genPrompt}
                onGenerate={generateProPrompt}
                generateLabel="Aprimorar prompt com IA"
                generateAgainLabel="Aprimorar novamente com IA"
              />

              {!promptReady ? (
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--coral-deep)", lineHeight: 1.45 }}>
                  Escreva pelo menos 50 caracteres no prompt ou clique em <strong>Aprimorar prompt com IA</strong> para continuar.
                </p>
              ) : null}

              {promptEnhancedByAi && coverPrompt.trim() ? (
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45, padding: "10px 12px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line)" }}>
                  Leia o prompt abaixo com atenção e confirme se está de acordo antes de gerar o convite.
                </p>
              ) : null}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "11px 14px", borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
                <div style={{ paddingRight: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Incluir informações na arte</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Data, horário e local impressos na imagem</div>
                </div>
                <Toggle on={includeInfo} onChange={setIncludeInfo} />
              </div>

              <button type="button" className="btn btn-dark" style={{ width: "100%", marginTop: 14 }} onClick={generateImage} disabled={!canGenerateImage}>
                <Icon name="image" size={15} />
                {imgState === "loading" ? "Desenhando…" : "Gerar convite com IA"}
              </button>

              {artApproved && coverUrl ? (
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#7d9a6f", textAlign: "center" }}>
                  Arte aprovada. Clique em Continuar para escrever o texto do convite.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        </InviteArtSubStepShell>

        <InviteArtSubStepShell step="art" currentStep={subStep} visible={isStepVisible("art")}>
        {/* 2 — Arte do convite */}
        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="image" size={17} style={{ color: "var(--coral)" }} />
              <strong style={{ fontSize: 14 }}>Arte do convite</strong>
            </div>
            <Tag>1 grátis</Tag>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <span className="fl" style={{ marginBottom: 0 }}>Tema da festa</span>
            {!themeEditing ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setThemeEditing(true)}>
                Editar
              </button>
            ) : null}
          </div>
          {themeEditing ? (
            <div style={{ marginBottom: 14 }}>
              <input className="input" value={themeDraft} onChange={(e) => setThemeDraft(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-dark btn-sm" disabled={savingTheme} onClick={() => void saveTheme()}>
                  {savingTheme ? "Salvando…" : "Salvar tema"}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setThemeDraft(event.theme); setThemeEditing(false); }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <input className="input" value={themeDraft} readOnly style={{ marginBottom: 14, background: "var(--card-2)" }} />
          )}

          <span className="fl">Estilo visual</span>
          <div style={{ marginBottom: 14 }}>
            <ArtStylePicker value={artStyle} onChange={setArtStyle} />
          </div>

          <FieldWithAi
            label="Prompt da imagem"
            hint="Escreva como imagina a cena (mínimo 50 caracteres) ou use Aprimorar prompt com IA."
            value={coverPrompt}
            onChange={(value) => {
              setCoverPrompt(value);
              if (value.trim().length >= 50) setPromptEnhancedByAi(false);
            }}
            placeholder="Descreva cores, elementos e clima da arte…"
            rows={4}
            loading={genPrompt}
            onGenerate={generateProPrompt}
            generateLabel="Aprimorar prompt com IA"
            generateAgainLabel="Aprimorar novamente com IA"
          />

          {!promptReady ? (
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--coral-deep)", lineHeight: 1.45 }}>
              Escreva pelo menos 50 caracteres no prompt ou clique em <strong>Aprimorar prompt com IA</strong> para continuar.
            </p>
          ) : null}

          {promptEnhancedByAi && coverPrompt.trim() ? (
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45, padding: "10px 12px", borderRadius: 10, background: "var(--card-2)", border: "1px solid var(--line)" }}>
              Leia o prompt abaixo com atenção e confirme se está de acordo antes de gerar o convite.
            </p>
          ) : null}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, padding: "11px 14px", borderRadius: 12, background: "var(--card-2)", border: "1px solid var(--line)" }}>
            <div style={{ paddingRight: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Incluir informações na arte</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>Data, horário e local impressos na imagem</div>
            </div>
            <Toggle on={includeInfo} onChange={setIncludeInfo} />
          </div>

          <button type="button" className="btn btn-dark" style={{ width: "100%", marginTop: 14 }} onClick={generateImage} disabled={!canGenerateImage}>
            <Icon name="image" size={15} />
            {imgState === "loading" ? "Desenhando…" : "Gerar convite com IA"}
          </button>

          {artApproved && coverUrl ? (
            <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#7d9a6f", textAlign: "center" }}>
              Arte aprovada. Clique em Continuar para escrever o texto do convite.
            </p>
          ) : null}
        </div>
        </InviteArtSubStepShell>
        </>
        ) : (
        <InviteArtSubStepShell step="art" currentStep={subStep} visible={isStepVisible("art")}>
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
                    setArtApproved(false);
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
        </InviteArtSubStepShell>
        )}

        <InviteArtSubStepShell step="text" currentStep={subStep} visible={isStepVisible("text")}>
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
        </InviteArtSubStepShell>

        {error ? <p style={{ color: "var(--coral-deep)", fontSize: 13, marginTop: 12 }}>{error}</p> : null}
      </div>

      {showInvitePreview ? (
      <div className={`invite-art-preview${isCompact ? " invite-art-preview--full" : ""}`} style={{ position: "sticky", top: 0 }}>
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
      ) : null}

      <CoverGenerationOverlay
        active={isAiMode && imgState === "loading"}
        capsuleActive={Boolean(event.capsuleActivatedAt)}
        composingWithBgRemoval={removeBackground && Boolean(photoUrl)}
      />

      <InviteArtApprovalModal
        open={showArtApproval && Boolean(coverUrl)}
        coverUrl={coverUrl}
        onApprove={handleApproveArt}
        onGenerateNew={handleGenerateNew}
        onClose={() => setShowArtApproval(false)}
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
});
