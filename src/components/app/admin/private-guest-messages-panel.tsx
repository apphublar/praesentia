"use client";

import { useCallback, useEffect, useState } from "react";
import type { GuestMessage } from "@/types/domain";
import { Icon } from "@/components/app/ui/icon";
import { Avatar } from "@/components/app/ui/primitives";
import { dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { formatGuestMessageDate } from "@/lib/events/format-guest-message-date";

export function PrivateGuestMessagesPanel({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { response, data } = await dashboardFetchJson(
        `/api/events/${eventId}/guest-messages?visibility=private`
      );
      if (!response.ok) {
        setError(String(data.error ?? "Não foi possível carregar recados privados."));
        setMessages([]);
        return;
      }
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setError("Erro de conexão ao carregar recados privados.");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return (
    <div className="private-guest-messages">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>
          Mensagens enviadas como privadas no link do convite — só você vê.
        </p>
        <button type="button" className="btn btn-ghost btn-sm" disabled={loading} onClick={() => void loadMessages()}>
          <Icon name="clock" size={14} />
          Atualizar
        </button>
      </div>

      {loading ? <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Carregando recados…</p> : null}
      {error ? <p style={{ margin: 0, fontSize: 13, color: "var(--coral-deep)" }}>{error}</p> : null}

      {!loading && !error && messages.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Nenhum recado privado ainda.</p>
      ) : null}

      <div className="private-guest-messages-list">
        {messages.map((message) => (
          <article key={message.id} className="private-guest-message-card">
            <div className="private-guest-message-head">
              <Avatar name={message.authorName} size={34} />
              <div>
                <strong>{message.authorName}</strong>
                <time dateTime={message.createdAt}>{formatGuestMessageDate(message.createdAt)}</time>
              </div>
            </div>
            <p>{message.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
