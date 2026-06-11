"use client";

import { useMemo, useState } from "react";
import type { Event, EventMember } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";
import { EventDetailsForm } from "@/components/dashboard/event-details-form";

type RequestState = {
  loading: boolean;
  message: string;
  tone: "ok" | "error" | "idle";
};

const idleState: RequestState = { loading: false, message: "", tone: "idle" };

function statusLabel(status: EventMember["accessStatus"]) {
  return status === "blocked" ? "Bloqueado" : "Ativo";
}

function roleLabel(role: EventMember["role"]) {
  const labels = {
    owner: "Responsável",
    manager: "Gestor",
    guest: "Convidado",
    viewer: "Visualização"
  };
  return labels[role];
}

function rsvpLabel(status: EventMember["rsvpStatus"]) {
  const labels = {
    pending: "Pendente",
    confirmed: "Confirmado",
    declined: "Recusou"
  };
  return labels[status];
}

export function EventSettingsForms({
  event,
  members,
  capsuleActive,
  needsRsvp = true
}: {
  event: Event;
  members: EventMember[];
  capsuleActive: boolean;
  needsRsvp?: boolean;
}) {
  const [pixEnabled, setPixEnabled] = useState(Boolean(event.pix?.enabled));
  const [receiverName, setReceiverName] = useState(event.pix?.receiverName ?? "");
  const [pixKey, setPixKey] = useState(event.pix?.key ?? "");
  const [suggestedAmount, setSuggestedAmount] = useState(event.pix?.suggestedAmount ? String(event.pix.suggestedAmount) : "");
  const [pixMessage, setPixMessage] = useState(event.pix?.message ?? "");
  const [pixState, setPixState] = useState<RequestState>(idleState);

  const [screenEnabled, setScreenEnabled] = useState(event.screen.enabled);
  const [screenPaused, setScreenPaused] = useState(event.screen.paused);
  const [showQrCode, setShowQrCode] = useState(event.screen.showQrCode);
  const [showVideos, setShowVideos] = useState(event.screen.showVideos);
  const [showMessages, setShowMessages] = useState(event.screen.showMessages);
  const [screenState, setScreenState] = useState<RequestState>(idleState);

  const [visibility, setVisibility] = useState(event.visibility);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [visibilityState, setVisibilityState] = useState<RequestState>(idleState);

  const [guestRows, setGuestRows] = useState(members);
  const [guestState, setGuestState] = useState<RequestState>(idleState);

  const ownerCount = useMemo(() => guestRows.filter((member) => member.role === "owner").length, [guestRows]);

  async function submitPix() {
    setPixState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          pix: {
            enabled: pixEnabled,
            receiverName,
            key: pixKey,
            suggestedAmount,
            message: pixMessage
          }
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar agora."));
      setPixState({ loading: false, message: "Pix do evento salvo.", tone: "ok" });
    } catch (error) {
      setPixState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar Pix."), tone: "error" });
    }
  }

  async function submitScreen() {
    setScreenState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/screen`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: screenEnabled,
          paused: screenPaused,
          showQrCode,
          showVideos,
          showMessages
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar agora."));
      setScreenState({ loading: false, message: "Telão atualizado em tempo real.", tone: "ok" });
    } catch (error) {
      setScreenState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar telão."), tone: "error" });
    }
  }

  async function submitVisibility(nextVisibility: Event["visibility"]) {
    setVisibilityState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          visibility: nextVisibility,
          acceptedPublicTerms: nextVisibility === "public" ? acceptedTerms : true
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar agora."));
      setVisibility(nextVisibility);
      setVisibilityState({
        loading: false,
        message: nextVisibility === "public" ? "Evento publicado com aceite registrado." : "Evento voltou para privado.",
        tone: "ok"
      });
    } catch (error) {
      setVisibilityState({ loading: false, message: apiErrorMessage(error, "Falha ao alterar privacidade."), tone: "error" });
    }
  }

  async function updateGuest(member: EventMember, action: "block" | "unblock") {
    setGuestState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/members/${member.userId}`, {
        method: "PATCH",
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar agora."));
      setGuestRows((current) => current.map((item) => (item.id === member.id ? data.member as EventMember : item)));
      setGuestState({
        loading: false,
        message: action === "block" ? "Convidado bloqueado e conteúdos arquivados." : "Convidado desbloqueado.",
        tone: "ok"
      });
    } catch (error) {
      setGuestState({ loading: false, message: apiErrorMessage(error, "Falha ao alterar convidado."), tone: "error" });
    }
  }

  return (
    <section className="dashboard-settings-grid" aria-label="Configurações do evento">
      <EventDetailsForm event={event} needsRsvp={needsRsvp} />

      <article className="settings-form-card">
        <div>
          <span className="pill">Pix do evento</span>
          <h2>Contribuição opcional</h2>
          <p>O responsável informa uma chave Pix para os convidados copiarem. A Praesentia não recebe nem intermedia valores.</p>
        </div>
        <div className="praesentia-form praesentia-form-grid settings-form">
          <label className="settings-switch">
            <input type="checkbox" checked={pixEnabled} onChange={(currentEvent) => setPixEnabled(currentEvent.target.checked)} />
            <span>Ativar Pix no convite</span>
          </label>
          <label className="field">
            <span>Nome do recebedor</span>
            <input value={receiverName} onChange={(currentEvent) => setReceiverName(currentEvent.target.value)} placeholder="Ex: Camila Andrade" />
          </label>
          <label className="field">
            <span>Chave Pix</span>
            <input value={pixKey} onChange={(currentEvent) => setPixKey(currentEvent.target.value)} placeholder="email, CPF, telefone ou chave aleatória" />
          </label>
          <label className="field">
            <span>Valor sugerido</span>
            <input inputMode="decimal" value={suggestedAmount} onChange={(currentEvent) => setSuggestedAmount(currentEvent.target.value)} placeholder="50" />
          </label>
          <label className="field field-span-full">
            <span>Mensagem</span>
            <textarea value={pixMessage} onChange={(currentEvent) => setPixMessage(currentEvent.target.value)} placeholder="Contribuição opcional para a festa." />
          </label>
          <button className="btn settings-primary-action" type="button" disabled={pixState.loading} onClick={submitPix}>
            {pixState.loading ? "Salvando..." : "Salvar Pix"}
          </button>
          <Status state={pixState} />
        </div>
      </article>

      <article className={`settings-form-card settings-form-card-dark${capsuleActive ? "" : " is-locked"}`}>
        <div>
          <span className="pill">telão ao vivo · cápsula</span>
          <h2>Mural em tempo real</h2>
          {capsuleActive ? (
            <p>Controla o que aparece no telão: publicação mais recente no fluxo principal e os três conteúdos mais curtidos ao lado.</p>
          ) : (
            <p>Este recurso faz parte da Cápsula Praesentia (R$59). Ative no painel para liberar telão, mural ao vivo e cápsula do tempo.</p>
          )}
        </div>
        {capsuleActive ? (
        <div className="praesentia-form praesentia-form-grid praesentia-form-compact settings-form">
          <label className="settings-switch"><input type="checkbox" checked={screenEnabled} onChange={(currentEvent) => setScreenEnabled(currentEvent.target.checked)} /><span>Telão ativo</span></label>
          <label className="settings-switch"><input type="checkbox" checked={screenPaused} onChange={(currentEvent) => setScreenPaused(currentEvent.target.checked)} /><span>Pausar atualização</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showQrCode} onChange={(currentEvent) => setShowQrCode(currentEvent.target.checked)} /><span>Mostrar QR Code</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showVideos} onChange={(currentEvent) => setShowVideos(currentEvent.target.checked)} /><span>Mostrar vídeos</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showMessages} onChange={(currentEvent) => setShowMessages(currentEvent.target.checked)} /><span>Mostrar recados</span></label>
          <button className="btn settings-primary-action" type="button" disabled={screenState.loading} onClick={submitScreen}>
            {screenState.loading ? "Atualizando..." : "Atualizar telão"}
          </button>
          <Status state={screenState} />
        </div>
        ) : (
          <p className="cover-field-help" style={{ margin: 0 }}>
            Ative a Cápsula na seção <strong>Cápsula · mural · telão</strong> acima para liberar este recurso.
          </p>
        )}
      </article>

      <article className="settings-form-card">
        <div>
          <span className="pill">privacidade</span>
          <h2>{visibility === "private" ? "Evento privado" : "Evento público"}</h2>
          <p>Todo evento nasce privado. Para publicar, o responsável precisa aceitar os termos e confirmar que entende a mudança de alcance.</p>
        </div>
        <div className="praesentia-form praesentia-form-grid praesentia-form-compact settings-form">
          <label className="settings-switch">
            <input type="checkbox" checked={acceptedTerms} onChange={(currentEvent) => setAcceptedTerms(currentEvent.target.checked)} />
            <span>Li e aceito os termos para evento público</span>
          </label>
          <div className="settings-actions-row">
            <button className="btn settings-primary-action" type="button" disabled={visibilityState.loading || visibility === "public"} onClick={() => submitVisibility("public")}>
              Tornar público
            </button>
            <button className="btn secondary settings-secondary-action" type="button" disabled={visibilityState.loading || visibility === "private"} onClick={() => submitVisibility("private")}>
              Voltar para privado
            </button>
          </div>
          <Status state={visibilityState} />
        </div>
      </article>

      <article className={`settings-form-card${capsuleActive ? "" : " is-locked"}`}>
        <div>
          <span className="pill">convidados · cápsula</span>
          <h2>Bloqueio e acesso ao mural</h2>
          {capsuleActive ? (
            <p>Ao bloquear, o convidado perde acesso ao mural e os conteúdos dele ficam arquivados até o desbloqueio.</p>
          ) : (
            <p>Moderar convidados no mural faz parte da Cápsula Praesentia. Ative a cápsula para liberar bloqueio e moderação.</p>
          )}
        </div>
        {capsuleActive ? (
          <div className="guest-list">
            {guestRows.map((member) => {
              const isOnlyOwner = member.role === "owner" && ownerCount <= 1;
              const blocked = member.accessStatus === "blocked";
              return (
                <div className="guest-row" key={member.id}>
                  <div>
                    <strong>{member.userId}</strong>
                    <span>{roleLabel(member.role)} · {rsvpLabel(member.rsvpStatus)} · {statusLabel(member.accessStatus)}</span>
                  </div>
                  <button
                    className={blocked ? "btn settings-primary-action" : "btn secondary settings-secondary-action"}
                    type="button"
                    disabled={guestState.loading || isOnlyOwner}
                    onClick={() => updateGuest(member, blocked ? "unblock" : "block")}
                  >
                    {blocked ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>
              );
            })}
            <Status state={guestState} />
          </div>
        ) : (
          <p className="cover-field-help" style={{ margin: 0 }}>
            Ative a Cápsula na seção <strong>Cápsula · mural · telão</strong> acima para liberar este recurso.
          </p>
        )}
      </article>
    </section>
  );
}

function Status({ state }: { state: RequestState }) {
  if (!state.message) return null;
  return <p className={`settings-status ${state.tone === "error" ? "is-error" : "is-ok"}`}>{state.message}</p>;
}
