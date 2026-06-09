"use client";

import { useMemo, useState } from "react";
import type { MediaItem } from "@/types/domain";

type SubmitState = {
  loading: boolean;
  message: string;
  tone: "idle" | "ok" | "error";
};

const idleState: SubmitState = { loading: false, message: "", tone: "idle" };

const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp";
const VIDEO_ACCEPT = "video/mp4,video/quicktime";

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel enviar agora.");
  return data;
}

export function GuestContributionPanel({
  eventId,
  items,
  currentUserId,
  canUploadVideo = false,
  onCreated,
  onDeleted
}: {
  eventId: string;
  items: MediaItem[];
  currentUserId?: string;
  canUploadVideo?: boolean;
  onCreated: (item: MediaItem) => void;
  onDeleted?: (mediaId: string) => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>(idleState);

  const messageCount = useMemo(() => items.filter((item) => item.type === "message").length, [items]);

  const myItems = useMemo(
    () => (currentUserId ? items.filter((item) => item.userId === currentUserId) : []),
    [items, currentUserId]
  );

  const fileAccept = canUploadVideo ? `${PHOTO_ACCEPT},${VIDEO_ACCEPT}` : PHOTO_ACCEPT;
  const fileHint = canUploadVideo
    ? "JPG, PNG, WEBP, MP4 ou MOV"
    : "JPG, PNG ou WEBP";

  async function deleteItem(mediaId: string) {
    setState({ loading: true, message: "", tone: "idle" });
    try {
      const res = await fetch(`/api/events/${eventId}/media/${mediaId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Nao foi possivel excluir.");
      onDeleted?.(mediaId);
      setState({ loading: false, message: "Conteudo excluido.", tone: "ok" });
    } catch (error) {
      setState({
        loading: false,
        message: error instanceof Error ? error.message : "Falha ao excluir.",
        tone: "error"
      });
    }
  }

  async function submitMessage() {
    setState({ loading: true, message: "", tone: "idle" });
    try {
      const data = await readJson(await fetch(`/api/events/${eventId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "message", text })
      }));
      onCreated(data.item);
      setText("");
      setState({ loading: false, message: "Recado enviado para a capsula.", tone: "ok" });
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : "Falha ao enviar recado.", tone: "error" });
    }
  }

  async function submitFile() {
    if (!file) {
      setState({ loading: false, message: "Escolha um arquivo antes de enviar.", tone: "error" });
      return;
    }

    if (!canUploadVideo && file.type.startsWith("video/")) {
      setState({ loading: false, message: "Somente o responsavel do evento pode enviar videos.", tone: "error" });
      return;
    }

    setState({ loading: true, message: "", tone: "idle" });
    try {
      const upload = await readJson(await fetch(`/api/events/${eventId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      }));

      if (typeof upload.uploadUrl === "string" && !upload.uploadUrl.startsWith("mock://")) {
        const putResponse = await fetch(upload.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type }
        });
        if (!putResponse.ok) throw new Error("Upload para Cloudflare falhou.");
      }

      const data = await readJson(await fetch(`/api/events/${eventId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize_upload",
          key: upload.key,
          contentType: file.type,
          size: file.size
        })
      }));

      onCreated(data.item);
      setFile(null);
      setState({ loading: false, message: "Memoria enviada para o mural.", tone: "ok" });
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : "Falha ao enviar arquivo.", tone: "error" });
    }
  }

  return (
    <div className="guest-contribution-panel praesentia-form">
      <div>
        <span className="pill">seu espaço</span>
        <h2>Compartilhar memória</h2>
        <p>
          {canUploadVideo
            ? "Como responsável, você pode enviar fotos e vídeos. Convidados confirmados enviam fotos e recados enquanto houver espaço na cápsula."
            : "Envie fotos e recados enquanto houver espaço na cápsula. Nem todo convidado precisa publicar — quem compartilha pode usar mais do espaço disponível."}
        </p>
      </div>

      {!canUploadVideo && messageCount >= 1 ? (
        <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: 0 }}>Você já enviou seu recado para este evento.</p>
      ) : null}

      <div className="guest-upload-grid">
        <label className="field field-file">
          <span>{canUploadVideo ? "Foto ou vídeo" : "Foto"}</span>
          <input
            type="file"
            accept={fileAccept}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="field-file-preview">{file ? file.name : fileHint}</span>
        </label>
        <button className="btn guest-action" type="button" disabled={state.loading} onClick={submitFile}>
          {state.loading ? "Enviando..." : "Enviar arquivo"}
        </button>
      </div>

      {!canUploadVideo && messageCount >= 1 ? null : (
        <>
          <label className="field">
            <span>Recado</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva algo que mereça ficar guardado..." />
          </label>
          <button className="btn secondary guest-message-action" type="button" disabled={state.loading} onClick={submitMessage}>
            Enviar recado
          </button>
        </>
      )}

      {state.message && <p className={`guest-submit-status ${state.tone === "error" ? "is-error" : "is-ok"}`}>{state.message}</p>}

      {myItems.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <strong style={{ fontSize: 14 }}>Suas publicações</strong>
          <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "6px 0 12px" }}>
            Você pode excluir seu conteúdo nas primeiras 24h após o início do evento.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14 }}>
                  {item.type === "message" ? `Recado: ${item.text?.slice(0, 40)}...` : item.type === "video" ? "Vídeo" : "Foto"}
                </span>
                <button type="button" className="btn secondary" disabled={state.loading} onClick={() => deleteItem(item.id)}>
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
