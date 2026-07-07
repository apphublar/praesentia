"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  adminAddCreativeAttempts,
  adminAddStorage,
  adminBlockUser,
  adminDeleteUser,
  adminRequestPasswordReset,
  adminSaveUserNotes,
  adminSetEventPlan
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
  const [detailUser, setDetailUser] = useState<AdminUserRow | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);
  const visibleUser = detailUser?.id === selectedId ? detailUser : selected;

  useEffect(() => {
    const first = users[0]?.id;
    if (first) setSelectedId((current) => current ?? first);
  }, [users]);

  useEffect(() => {
    if (!selectedId) return;
    void loadEvents(selectedId);
  }, [selectedId]);

  async function loadEvents(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setEvents(data.events ?? []);
    setDetailUser(data.user ?? null);
    setNotes(data.user?.adminNotes ?? "");
  }

  function selectUser(userId: string) {
    setSelectedId(userId);
    setDetailUser(null);
    setMessage(null);
    setError(null);
    setResetLink(null);
    void loadEvents(userId);
  }

  function run(action: () => Promise<{ ok?: boolean; error?: string; message?: string; resetLink?: string; whatsappUrl?: string }>) {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      setResetLink(null);
      const result = await action();
      if (result.error) setError(result.error);
      if (result.message) setMessage(result.message);
      if (result.resetLink) setResetLink(result.resetLink);
      if (result.whatsappUrl) window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
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
        {!visibleUser ? (
          <p>Selecione um cliente.</p>
        ) : (
          <>
            <div className="platform-admin-detail-head">
              <div>
                <h2>{visibleUser.name}</h2>
                <p>{visibleUser.email}</p>
              </div>
              <span className={`platform-admin-badge${visibleUser.blockedAt ? " is-danger" : ""}`}>
                {visibleUser.blockedAt ? "Bloqueado" : "Ativo"}
              </span>
            </div>

            <div className="platform-admin-kv">
              <div><b>Eventos</b><span>{visibleUser.eventCount}</span></div>
              <div><b>Cápsulas</b><span>{visibleUser.paidEventCount}</span></div>
              <div><b>Faturado</b><span>{formatBrl(visibleUser.totalRevenueBrl)}</span></div>
              <div><b>GB extra</b><span>{visibleUser.storageExtraGb.toFixed(1)} GB</span></div>
              <div><b>Tentativas IA</b><span>{visibleUser.aiInvitePoolRemaining}</span></div>
              <div><b>Plus</b><span>{visibleUser.hasActiveSubscription ? "Sim" : "Não"}</span></div>
            </div>

            <label className="platform-admin-field">
              <span>Notas internas</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>

            <div className="platform-admin-actions">
              <button type="button" className="btn" disabled={pending} onClick={() => run(() => adminSaveUserNotes(visibleUser.id, notes))}>
                Salvar notas
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pending}
                onClick={() => run(() => adminBlockUser(visibleUser.id, !visibleUser.blockedAt))}
              >
                {visibleUser.blockedAt ? "Desbloquear" : "Bloquear"}
              </button>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => run(() => adminAddCreativeAttempts(visibleUser.id, "criativo"))}>
                +15 tentativas criativas
              </button>
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={() => run(() => adminAddCreativeAttempts(visibleUser.id, "inspiracao"))}>
                +5 tentativas inspiração
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pending}
                onClick={() => run(() => adminRequestPasswordReset(visibleUser.id))}
              >
                Redefinir senha (WhatsApp)
              </button>
              {resetLink ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(resetLink);
                    setMessage("Link de redefinição copiado.");
                  }}
                >
                  Copiar link de senha
                </button>
              ) : null}
              <a
                className="btn btn-secondary"
                href={whatsAppLink(`Olá ${visibleUser.name}, aqui é da equipe Praesentia.`)}
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
                  run(() => adminDeleteUser(visibleUser.id));
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
                      <td>
                        <div className="platform-admin-row-actions">
                            {event.capsuleActivatedAt ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={pending}
                                onClick={() => {
                                  if (!window.confirm("Voltar este evento para o plano gratuito?")) return;
                                  run(() => adminSetEventPlan(event.id, visibleUser.id, "free"));
                                }}
                              >
                                Definir Gratuito
                              </button>
                            ) : null}
                            {event.planTier !== "capsule" || !event.capsuleActivatedAt ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={pending}
                                onClick={() => run(() => adminSetEventPlan(event.id, visibleUser.id, "capsule"))}
                              >
                                Liberar Cápsula
                              </button>
                            ) : null}
                            {event.planTier !== "family" || !event.capsuleActivatedAt ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                disabled={pending}
                                onClick={() => run(() => adminSetEventPlan(event.id, visibleUser.id, "family"))}
                              >
                                Liberar Cápsula Plus
                              </button>
                            ) : null}
                          {!event.capsuleActivatedAt ? (
                            <span className="mono">bloqueado</span>
                          ) : null}
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={pending}
                            onClick={() => run(() => adminAddStorage(event.id, visibleUser.id, 5))}
                          >
                            +5 GB
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            disabled={pending}
                            onClick={() => run(() => adminAddStorage(event.id, visibleUser.id, 10))}
                          >
                            +10 GB
                          </button>
                          <a className="btn btn-sm btn-secondary" href={`${appBaseUrl}/evento/${event.slug}`} target="_blank" rel="noreferrer">
                            Link convite
                          </a>
                          <a className="btn btn-sm btn-secondary" href={`${appBaseUrl}/dashboard/eventos/${event.id}`} target="_blank" rel="noreferrer">
                            Painel
                          </a>
                        </div>
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
