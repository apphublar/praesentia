"use client";

import { useState } from "react";
import Image from "next/image";
import type { Event } from "@/types/domain";

export type CoverQuota = {
  maxGenerations: number;
  maxEdits: number;
  remainingGenerations: number;
  remainingEdits: number;
  canGenerate: boolean;
  canEdit: boolean;
  allowsCustomUpload: boolean;
};

const DEFAULT_INCLUDE = {
  title: true,
  date: true,
  location: true,
  hostName: true,
  theme: true
};

export function CoverGenerator({
  eventId,
  eventSlug,
  planTier,
  capsuleActive,
  currentCoverUrl,
  coverSource,
  pendingUrls = [],
  inviteWhatsappText,
  initialQuota,
  onCoverChange,
  showShareActions = true
}: {
  eventId: string;
  eventSlug: string;
  planTier: Event["plan"]["tier"];
  capsuleActive: boolean;
  currentCoverUrl?: string;
  coverSource?: Event["coverSource"];
  pendingUrls?: string[];
  inviteWhatsappText?: string;
  initialQuota: CoverQuota;
  onCoverChange?: (url: string) => void;
  showShareActions?: boolean;
}) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl ?? "");
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
    : `Confira: ${shareLink}`;
  const isPaid = capsuleActive && planTier !== "free";

  function applyCover(url: string, nextSource?: Event["coverSource"]) {
    setCoverUrl(url);
    onCoverChange?.(url);
    if (nextSource) setSource(nextSource);
  }

  async function generate(mode: "generate" | "edit" = "generate") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          editHint: mode === "edit" ? editHint : undefined,
          orientation: orientation || undefined,
          includeFields
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar imagem.");
        setLoading(false);
        return;
      }
      if (data.coverImageUrl) applyCover(data.coverImageUrl, "ai");
      if (data.pendingUrls) setPending(data.pendingUrls);
      if (data.quota) setQuota(data.quota);
      if (mode === "edit") setEditHint("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  async function selectVersion(url: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/generate-cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "select", coverImageUrl: url })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao selecionar versão.");
        setLoading(false);
        return;
      }
      applyCover(data.coverImageUrl, "ai");
      setPending(data.pendingUrls ?? []);
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  async function uploadCustom(file: File) {
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/events/${eventId}/cover`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar convite.");
        setLoading(false);
        return;
      }
      applyCover(data.coverImageUrl, "custom");
      setPending([]);
      if (data.quota) setQuota(data.quota);
    } catch {
      setError("Erro de conexão.");
    }
    setLoading(false);
  }

  return (
    <article className="card dashboard-card">
      <span className="pill">imagem do convite</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>Imagem para WhatsApp e Stories</h2>

      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14, marginBottom: 16 }}>
        {isPaid
          ? `Plano pago: até ${quota.maxGenerations} versões por IA e ${quota.maxEdits} ajustes.`
          : "Escolha o que entra na arte, oriente a IA e gere uma vez — ou envie sua imagem."}
      </p>

      <div className="cover-include-grid">
        {(Object.keys(DEFAULT_INCLUDE) as Array<keyof typeof DEFAULT_INCLUDE>).map((key) => (
          <label key={key} className="cover-include-option">
            <input
              type="checkbox"
              checked={includeFields[key]}
              onChange={(e) => setIncludeFields((current) => ({ ...current, [key]: e.target.checked }))}
            />
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

      <label className="field" style={{ marginTop: 16 }}>
        <span>Orientação para a IA</span>
        <textarea
          value={orientation}
          onChange={(e) => setOrientation(e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Ex: fundo azul claro, flores delicadas, estilo minimalista, sem rostos..."
        />
      </label>

      {coverUrl ? (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start", marginTop: 20 }}>
          <Image
            src={coverUrl}
            alt="Capa do convite"
            width={200}
            height={356}
            unoptimized={coverUrl.startsWith("data:")}
            style={{ borderRadius: 14, boxShadow: "0 4px 18px rgba(27,18,9,.12)", objectFit: "cover" }}
          />
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14 }}>
              {source === "custom" ? "Imagem enviada por você." : "Imagem gerada com IA."}
            </p>
            {showShareActions && (
              <>
                <a href={coverUrl} download="convite.png" className="btn secondary" style={{ textAlign: "center" }}>
                  Baixar imagem
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ background: "#25D366", color: "#fff", textAlign: "center", textDecoration: "none" }}
                >
                  Compartilhar no WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      ) : null}

      {pending.length > 1 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontWeight: 700, marginBottom: 10 }}>Escolha uma versão:</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {pending.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => selectVersion(url)}
                disabled={loading}
                style={{ border: coverUrl === url ? "2px solid var(--coral)" : "1px solid var(--line)", borderRadius: 12, padding: 4, background: "#fff", cursor: "pointer" }}
              >
                <Image src={url} alt="Versão do convite" width={90} height={160} style={{ borderRadius: 8, objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {quota.canGenerate && (
          <button type="button" className="btn" onClick={() => generate("generate")} disabled={loading}>
            {loading ? "Gerando..." : isPaid ? `✨ Gerar versão (${quota.remainingGenerations} restante${quota.remainingGenerations !== 1 ? "s" : ""})` : "✨ Gerar convite com IA (1x)"}
          </button>
        )}

        {isPaid && quota.canEdit && coverUrl && source === "ai" && (
          <div className="praesentia-form praesentia-form-stack">
            <label className="field">
              <span>Ajuste na imagem</span>
              <input
                value={editHint}
                onChange={(e) => setEditHint(e.target.value)}
                placeholder="Descreva o ajuste que quer na imagem..."
                maxLength={400}
              />
            </label>
            <button type="button" className="btn secondary" onClick={() => generate("edit")} disabled={loading || editHint.length < 4}>
              Pedir ajuste à IA ({quota.remainingEdits} restante{quota.remainingEdits !== 1 ? "s" : ""})
            </button>
          </div>
        )}

        {quota.allowsCustomUpload && (
          <label className="btn secondary" style={{ textAlign: "center", cursor: "pointer" }}>
            Enviar minha imagem
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCustom(file);
              }}
            />
          </label>
        )}

        {error && <p style={{ color: "var(--coral)", fontSize: 13 }}>{error}</p>}
      </div>
    </article>
  );
}
