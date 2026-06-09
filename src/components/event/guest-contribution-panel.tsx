"use client";

import { useMemo, useState } from "react";
import type { MediaItem } from "@/types/domain";

type SubmitState = {
  loading: boolean;
  message: string;
  tone: "idle" | "ok" | "error";
};

const idleState: SubmitState = { loading: false, message: "", tone: "idle" };

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Nao foi possivel enviar agora.");
  return data;
}

export function GuestContributionPanel({
  eventId,
  items,
  currentUserId,
  onCreated,
  onDeleted
}: {
  eventId: string;
  items: MediaItem[];
  currentUserId?: string;
  onCreated: (item: MediaItem) => void;
  onDeleted?: (mediaId: string) => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<SubmitState>(idleState);

  const usage = useMemo(() => ({
    photos: items.filter((item) => item.type === "photo").length,
    videos: items.filter((item) => item.type === "video").length,
    messages: items.filter((item) => item.type === "message").length
  }), [items]);

  const myItems = useMemo(
    () => (currentUserId ? items.filter((item) => item.userId === currentUserId) : []),
    [items, currentUserId]
  );

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
      setState({ loading: false, message: "Escolha uma foto ou video antes de enviar.", tone: "error" });
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
        <p>Somente convidados confirmados e com conta podem enviar. O conteúdo entra sem moderação prévia, e o responsável pode arquivar depois.</p>
      </div>

      <div className="guest-quota-grid">
        <Quota value={`${usage.photos}/2`} label="fotos" />
        <Quota value={`${usage.videos}/1`} label="video" />
        <Quota value={`${usage.messages}/1`} label="recado" />
      </div>

      <div className="guest-upload-grid">
        <label className="field field-file">
          <span>Foto ou vídeo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <span className="field-file-preview">{file ? file.name : "JPG, PNG, WEBP, MP4 ou MOV"}</span>
        </label>
        <button className="btn guest-action" type="button" disabled={state.loading} onClick={submitFile}>
          {state.loading ? "Enviando..." : "Enviar arquivo"}
        </button>
      </div>

      <label className="field">
        <span>Recado</span>
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Escreva algo que mereça ficar guardado..." />
      </label>
      <button className="btn secondary guest-message-action" type="button" disabled={state.loading} onClick={submitMessage}>
        Enviar recado
      </button>

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

function Quota({ value, label }: { value: string; label: string }) {
  return (
    <div className="guest-quota">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
