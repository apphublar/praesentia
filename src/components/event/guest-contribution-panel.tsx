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

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar agora.");
  return data;
}

export function GuestContributionPanel({
  eventId,
  items,
  currentUserId,
  guestRsvpId,
  muralGuestMode = false,
  canUploadVideo = false,
  onCreated,
  onDeleted
}: {
  eventId: string;
  items: MediaItem[];
  currentUserId?: string;
  guestRsvpId?: string;
  muralGuestMode?: boolean;
  canUploadVideo?: boolean;
  onCreated: (item: MediaItem) => void;
  onDeleted?: (mediaId: string) => void;
}) {
  const [text, setText] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>(idleState);

  const messageCount = useMemo(() => items.filter((item) => item.type === "message").length, [items]);

  const myItems = useMemo(() => {
    if (muralGuestMode && guestRsvpId) return items.filter((item) => item.guestRsvpId === guestRsvpId);
    if (currentUserId) return items.filter((item) => item.userId === currentUserId);
    return [];
  }, [items, currentUserId, guestRsvpId, muralGuestMode]);

  async function deleteItem(mediaId: string) {
    setState({ loading: true, message: "", tone: "idle" });
    try {
      const res = await fetch(`/api/events/${eventId}/media/${mediaId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Não foi possível excluir.");
      onDeleted?.(mediaId);
      setState({ loading: false, message: "Conteúdo excluído.", tone: "ok" });
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
      setState({ loading: false, message: "Recado de carinho enviado.", tone: "ok" });
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : "Falha ao enviar recado.", tone: "error" });
    }
  }

  async function submitFile() {
    if (!file) {
      setState({ loading: false, message: "Escolha uma foto antes de enviar.", tone: "error" });
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
          size: file.size,
          caption: caption.trim()
        })
      }));

      onCreated(data.item);
      setFile(null);
      setCaption("");
      setState({ loading: false, message: "Foto enviada para o mural.", tone: "ok" });
    } catch (error) {
      setState({ loading: false, message: error instanceof Error ? error.message : "Falha ao enviar foto.", tone: "error" });
    }
  }

  return (
    <div className="guest-contribution-panel praesentia-form">
      <div>
        <span className="pill">seu espaço no mural</span>
        <h2>Compartilhar no evento</h2>
        <p>
          Envie fotos com título curto e <strong>1 recado de carinho</strong> para o homenageado.
          Vídeos são exclusivos do organizador.
        </p>
      </div>

      <div className="guest-upload-grid">
        <label className="field field-file">
          <span>Foto do momento</span>
          <input type="file" accept={PHOTO_ACCEPT} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <span className="field-file-preview">{file ? file.name : "JPG, PNG ou WEBP"}</span>
        </label>
        <label className="field">
          <span>Título curto da foto</span>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={80} placeholder="Ex: Momento especial!" />
        </label>
        <button className="btn guest-action" type="button" disabled={state.loading || !file} onClick={submitFile}>
          {state.loading ? "Enviando..." : "Enviar foto"}
        </button>
      </div>

      {messageCount >= 1 ? (
        <p className="cover-field-help">Você já enviou seu recado de carinho.</p>
      ) : (
        <>
          <label className="field">
            <span>Recado de carinho (único)</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={600}
              placeholder="Escreva uma homenagem para o homenageado..."
            />
          </label>
          <button className="btn secondary guest-message-action" type="button" disabled={state.loading || text.trim().length < 2} onClick={submitMessage}>
            Enviar recado
          </button>
        </>
      )}

      {state.message ? <p className={`guest-submit-status ${state.tone === "error" ? "is-error" : "is-ok"}`}>{state.message}</p> : null}

      {myItems.length > 0 && !muralGuestMode ? (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <strong style={{ fontSize: 14 }}>Suas publicações</strong>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {myItems.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 14 }}>
                  {item.type === "message" ? `Recado: ${item.text?.slice(0, 40)}...` : item.caption || "Foto"}
                </span>
                <button type="button" className="btn secondary" disabled={state.loading} onClick={() => deleteItem(item.id)}>
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
