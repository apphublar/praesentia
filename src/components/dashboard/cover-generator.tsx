"use client";

import { useState } from "react";
import Image from "next/image";

export function CoverGenerator({ eventId, currentCoverUrl }: { eventId: string; currentCoverUrl?: string }) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/events/${eventId}/generate-cover`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao gerar imagem."); setLoading(false); return; }
      setCoverUrl(data.coverImageUrl);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  }

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const waText = encodeURIComponent(`Você está convidado! Confirme sua presença: ${appUrl}/evento/`);

  return (
    <article className="card" style={{ padding: 22 }}>
      <span className="pill">imagem do convite</span>
      <h2 className="display" style={{ fontSize: 28, margin: "12px 0" }}>Imagem para WhatsApp e Stories</h2>

      {coverUrl ? (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Image src={coverUrl} alt="Capa do convite" width={200} height={356}
            style={{ borderRadius: 14, boxShadow: "0 4px 18px rgba(27,18,9,.12)", objectFit: "cover" }} />
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, fontSize: 14 }}>
              Imagem gerada com IA. Você pode baixá-la e compartilhar no WhatsApp, Instagram Stories ou qualquer outra rede.
            </p>
            <a href={coverUrl} download="convite.png" className="btn secondary" style={{ textAlign: "center" }}>
              Baixar imagem
            </a>
            <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer"
              className="btn" style={{ background: "#25D366", color: "#fff", textAlign: "center", textDecoration: "none" }}>
              Compartilhar no WhatsApp
            </a>
            <button type="button" className="btn secondary" onClick={generate} disabled={loading}>
              {loading ? "Gerando nova versão..." : "Gerar nova versão"}
            </button>
            {error && <p style={{ color: "var(--coral)", fontSize: 13 }}>{error}</p>}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Gere uma imagem vertical personalizada para o seu evento usando IA (DALL-E 3).
            Perfeita para compartilhar no WhatsApp e Stories.
          </p>
          <button type="button" className="btn" onClick={generate} disabled={loading} style={{ alignSelf: "flex-start" }}>
            {loading ? "Gerando imagem... (pode levar 20s)" : "✨ Gerar imagem do convite com IA"}
          </button>
          {error && <p style={{ color: "var(--coral)", fontSize: 13 }}>{error}</p>}
        </div>
      )}
    </article>
  );
}
