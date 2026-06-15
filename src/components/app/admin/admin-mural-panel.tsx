"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Event, MediaItem, MuralAccessRequest } from "@/types/domain";
import { ConfigRow } from "@/components/app/admin/conf-block";
import { Icon } from "@/components/app/ui/icon";
import { Avatar, Mono, StripePhoto } from "@/components/app/ui/primitives";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { resolveMediaItemUrl } from "@/lib/storage/media-url";

export function AdminMuralPanel({
  event,
  items,
  initialAccessRequests = [],
  layout = "split",
  showTelaoLink = true
}: {
  event: Event;
  items: MediaItem[];
  initialAccessRequests?: MuralAccessRequest[];
  layout?: "split" | "stack";
  showTelaoLink?: boolean;
}) {
  const [rows, setRows] = useState(items);
  const [accessRequests, setAccessRequests] = useState<MuralAccessRequest[]>(initialAccessRequests);
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const [screenEnabled, setScreenEnabled] = useState(event.screen.enabled);
  const [showMessages, setShowMessages] = useState(event.screen.showMessages);
  const [showVideos, setShowVideos] = useState(event.screen.showVideos);
  const [screenError, setScreenError] = useState("");

  useEffect(() => {
    if (initialAccessRequests.length > 0) return;
    fetch(`/api/events/${event.id}/mural/access-requests`)
      .then((res) => res.json())
      .then((data) => setAccessRequests(data.requests ?? []))
      .catch(() => undefined);
  }, [event.id, initialAccessRequests.length]);

  const pending = accessRequests.filter((item) => item.status === "pending");
  const photos = rows.filter((item) => item.type !== "message");

  async function saveScreen(patch: Partial<{ enabled: boolean; showMessages: boolean; showVideos: boolean }>) {
    setScreenError("");
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/screen`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: patch.enabled ?? screenEnabled,
          paused: event.screen.paused,
          showQrCode: event.screen.showQrCode,
          showVideos: patch.showVideos ?? showVideos,
          showMessages: patch.showMessages ?? showMessages
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar."));
    } catch (error) {
      setScreenError(apiErrorMessage(error, "Falha ao salvar regras."));
    }
  }

  async function patchItem(mediaId: string, action: "archive" | "hide_from_screen" | "show_on_screen") {
    const item = rows.find((row) => row.id === mediaId);
    if (!item) return;
    const response = await fetch(`/api/events/${item.eventId}/media/${mediaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    if (!response.ok) return;
    const data = (await response.json()) as { item: MediaItem };
    setRows((current) => current.map((row) => (row.id === mediaId ? data.item : row)));
  }

  async function deleteItem(item: MediaItem) {
    const response = await fetch(`/api/events/${item.eventId}/media/${item.id}`, { method: "DELETE" });
    if (!response.ok) return;
    setRows((current) => current.filter((row) => row.id !== item.id));
  }

  async function reviewAccessRequest(requestId: string, status: "approved" | "denied") {
    setLoadingRequestId(requestId);
    try {
      const res = await fetch(`/api/events/${event.id}/mural/access-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status })
      });
      const data = await res.json();
      if (res.ok) {
        setAccessRequests((current) => current.map((item) => (item.id === requestId ? data.request : item)));
      }
    } finally {
      setLoadingRequestId(null);
    }
  }

  const contentGrid = (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <h3 className="serif-i" style={{ fontSize: 20, margin: 0 }}>
          Conteúdo do mural
        </h3>
        {showTelaoLink ? (
          <Link className="btn btn-dark btn-sm" href={`/dashboard/eventos/${event.id}/telao`}>
            <Icon name="proj" size={15} />
            Configurar telão
          </Link>
        ) : null}
      </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
          {photos.map((item) => {
            const url = resolveMediaItemUrl(event.id, item);
            return (
              <div key={item.id} className="card" style={{ overflow: "hidden" }}>
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                ) : (
                  <StripePhoto color="var(--p-green)" ratio="1 / 1" />
                )}
                <div style={{ padding: "9px 11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>{item.authorName}</span>
                  <div style={{ display: "flex", gap: 8, color: "var(--faint)" }}>
                    <button
                      type="button"
                      aria-label={item.visibleOnScreen ? "Ocultar do telão" : "Mostrar no telão"}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", padding: 0 }}
                      onClick={() => patchItem(item.id, item.visibleOnScreen ? "hide_from_screen" : "show_on_screen")}
                    >
                      <Icon name="eye" size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", padding: 0 }}
                      onClick={() => deleteItem(item)}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );

  const sidebar = (
    <>
      <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Icon name="bell" size={16} style={{ color: "var(--coral)" }} />
            <strong style={{ fontSize: 14 }}>Pedidos de acesso</strong>
            {pending.length > 0 ? (
              <span style={{ marginLeft: "auto", background: "var(--coral)", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 8px" }}>
                {pending.length}
              </span>
            ) : null}
          </div>
          {pending.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>
              Tudo aprovado por aqui.
            </p>
          ) : (
            pending.map((request) => (
              <div key={request.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
                <Avatar name={`${request.guestFirstName} ${request.guestLastName}`} size={32} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
                  {request.guestFirstName} {request.guestLastName}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-coral"
                  style={{ padding: "5px 12px" }}
                  disabled={loadingRequestId === request.id}
                  onClick={() => reviewAccessRequest(request.id, "approved")}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => reviewAccessRequest(request.id, "denied")}
                  disabled={loadingRequestId === request.id}
                  style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--faint)" }}
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <Mono style={{ display: "block", marginBottom: 12 }}>Regras do mural</Mono>
          <ConfigRow
            label="Convidados podem postar fotos"
            on={screenEnabled}
            onChange={(value) => {
              setScreenEnabled(value);
              void saveScreen({ enabled: value });
            }}
          />
          <ConfigRow label="Recados precisam de aprovação" on={false} onChange={() => undefined} />
          <ConfigRow
            label="Curtidas visíveis"
            on={showVideos}
            onChange={(value) => {
              setShowVideos(value);
              void saveScreen({ showVideos: value });
            }}
          />
          <ConfigRow
            label="Recados no telão"
            on={showMessages}
            onChange={(value) => {
              setShowMessages(value);
              void saveScreen({ showMessages: value });
            }}
          />
          {screenError ? <p style={{ color: "var(--coral-deep)", fontSize: 12, margin: "8px 0 0" }}>{screenError}</p> : null}
        </div>
    </>
  );

  if (layout === "stack") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {contentGrid}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{sidebar}</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,340px)", gap: 24, alignItems: "start" }}>
      {contentGrid}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{sidebar}</div>
    </div>
  );
}
