"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  adminActivateCapsule,
  adminAddCreativeAttempts,
  adminAddStorage,
  adminBlockUser,
  adminDeleteUser,
  adminSaveUserNotes
} from "@/app/admin/actions";
import { formatBrl } from "@/lib/admin/constants";
import type { AdminUserEventRow, AdminUserRow } from "@/lib/db/admin-types";

function whatsAppLink(message: string) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function AdminClientsPanel({
  users,
  appBaseUrl
}: {
  users: AdminUserRow[];
  appBaseUrl: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminUserEventRow[]>([]);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);

  useEffect(() => {
    const first = users[0]?.id;
    if (first) setSelectedId((current) => current ?? first);
  }, [users]);

  useEffect(() => {
    if (!selectedId) return;
    void loadEvents(selectedId);
  }, [selectedId]);

  async function loadEvents(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`);
    if (!response.ok) return;
    const data = await response.json();
    setEvents(data.events ?? []);
    setNotes(data.user?.adminNotes ?? "");
  }

  function selectUser(userId: string) {
    setSelectedId(userId);
    setMessage(null);
    setError(null);
    void loadEvents(userId);
  }

  function run(action: () => Promise<{ ok?: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const result = await action();
      if (result.error) setError(result.error);
      if (result.message) setMessage(result.message);
      if (selectedId) await loadEvents(selectedId);
    });
  }

  return (
    <div className="platform-admin-split">
      <section className="card platform-admin-list">
        <h2>Clientes ({users.length})</h2>
        <div className="platform-admin-user-rows">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={`platform-admin-user-row${selectedId === user.id ? " is-active" : ""}`}
              onClick={() => selectUser(user.id)}
            >
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <small>
                {user.paidEventCount > 0 || user.hasActiveSubscription ? "Pago" : "Gratuito"}
                {user.blockedAt ? " · Bloqueado" : ""}
              </small>
            </button>
          ))}
        </div>
      </section>

      <section className="card platform-admin-detail">
        {!selected ? (
          <p>Selecione um cliente.</p>
        ) : (
          <>
            <div className="platform-admin-detail-head">
              <div>
                <h2>{selected.name}</h2>
                <p>{selected.email}</p>
              </div>
              <span className={`platform-admin-badge${selected.blockedAt ? " is-danger" : ""}`}>
                {selected.blockedAt ? "Bloqueado" : "Ativo"}
              </span>
            </div>

            <div className="platform-admin-kv">
              <div><b>Eventos</b><span>{selected.eventCount}</span></div>
              <div><b>Cápsulas</b><span>{selected.paidEventCount}</span></div>
              <div><b>Faturado</b><span>{formatBrl(selected.totalRevenueBrl)}</span></div>
              <div><b>GB extra</b><span>{selected.storageExtraGb.toFixed(1)} GB</span></div>
              <div><b>Tentativas IA</b><span>{selected.aiInvitePoolRemaining}</span></div>
              <div><b>Plus</b><span>{selected.hasActiveSubscription ? "Sim" : "Não"}</span></div>
            </div>

            <label className="platform-admin-field">
              <span>Notas internas</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>

            <div className="platform-admin-actions">
              <button type="button" className="btn" disabled={pending} onClick={() => run(() => adminSaveUserNotes(selected.id, notes))}>
                Salvar notas
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pending}
                onClick={() => run(() => adminBlockUser(selected.id, !selected.blockedAt))}
              >
                {selected.blockedAt ? "Desbloquear" : "Bloquear"}
              </button>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => run(() => adminAddCreativeAttempts(selected.id, "criativo"))}>
                +15 tentativas criativas
              </button>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => run(() => adminAddCreativeAttempts(selected.id, "inspiracao"))}>
                +5 tentativas inspiração
              </button>
              <a
                className="btn btn-secondary"
                href={whatsAppLink(`Olá ${selected.name}, aqui é da equipe Praesentia.`)}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              <button
                type="button"
                className="btn btn-danger"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Excluir permanentemente esta conta?")) return;
                  run(() => adminDeleteUser(selected.id));
                }}
              >
                Excluir conta
              </button>
            </div>

            <h3>Eventos do cliente</h3>
            <div className="platform-admin-table-wrap">
              <table className="platform-admin-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Plano</th>
                    <th>Capa</th>
                    <th>Armaz.</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.title}</strong>
                        <small>{event.slug}</small>
                      </td>
                      <td>{event.capsuleActivatedAt ? event.planTier : "free"}</td>
                      <td>{event.coverSource === "custom" ? "Própria" : "IA"}</td>
                      <td>{event.storageUsedGb.toFixed(1)}/{event.storageLimitGb.toFixed(0)} GB</td>
                      <td className="platform-admin-row-actions">
                        {!event.capsuleActivatedAt ? (
                          <button type="button" disabled={pending} onClick={() => run(() => adminActivateCapsule(event.id, selected.id))}>
                            Liberar cápsula
                          </button>
                        ) : null}
                        <button type="button" disabled={pending} onClick={() => run(() => adminAddStorage(event.id, selected.id, 5))}>+5 GB</button>
                        <button type="button" disabled={pending} onClick={() => run(() => adminAddStorage(event.id, selected.id, 10))}>+10 GB</button>
                        <a href={`${appBaseUrl}/evento/${event.slug}`} target="_blank" rel="noreferrer">Link convite</a>
                        <a href={`${appBaseUrl}/dashboard/eventos/${event.id}`} target="_blank" rel="noreferrer">Painel</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {message ? <p className="platform-admin-notice">{message}</p> : null}
            {error ? <p className="platform-admin-error">{error}</p> : null}
          </>
        )}
      </section>
    </div>
  );
}
