"use client";

import { useMemo, useState } from "react";
import type { Event, EventMember } from "@/types/domain";

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
    owner: "Responsavel",
    manager: "Gestor",
    guest: "Convidado",
    viewer: "Visualizacao"
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

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? "Nao foi possivel salvar agora.");
  }
  return data;
}

export function EventSettingsForms({ event, members }: { event: Event; members: EventMember[] }) {
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
      await parseResponse(await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pix: {
            enabled: pixEnabled,
            receiverName,
            key: pixKey,
            suggestedAmount,
            message: pixMessage
          }
        })
      }));
      setPixState({ loading: false, message: "Pix do evento salvo.", tone: "ok" });
    } catch (error) {
      setPixState({ loading: false, message: error instanceof Error ? error.message : "Falha ao salvar Pix.", tone: "error" });
    }
  }

  async function submitScreen() {
    setScreenState({ loading: true, message: "", tone: "idle" });
    try {
      await parseResponse(await fetch(`/api/events/${event.id}/screen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: screenEnabled,
          paused: screenPaused,
          showQrCode,
          showVideos,
          showMessages
        })
      }));
      setScreenState({ loading: false, message: "Telão atualizado em tempo real.", tone: "ok" });
    } catch (error) {
      setScreenState({ loading: false, message: error instanceof Error ? error.message : "Falha ao salvar telão.", tone: "error" });
    }
  }

  async function submitVisibility(nextVisibility: Event["visibility"]) {
    setVisibilityState({ loading: true, message: "", tone: "idle" });
    try {
      await parseResponse(await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibility: nextVisibility,
          acceptedPublicTerms: nextVisibility === "public" ? acceptedTerms : true
        })
      }));
      setVisibility(nextVisibility);
      setVisibilityState({
        loading: false,
        message: nextVisibility === "public" ? "Evento publicado com aceite registrado." : "Evento voltou para privado.",
        tone: "ok"
      });
    } catch (error) {
      setVisibilityState({ loading: false, message: error instanceof Error ? error.message : "Falha ao alterar privacidade.", tone: "error" });
    }
  }

  async function updateGuest(member: EventMember, action: "block" | "unblock") {
    setGuestState({ loading: true, message: "", tone: "idle" });
    try {
      const data = await parseResponse(await fetch(`/api/events/${event.id}/members/${member.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      }));
      setGuestRows((current) => current.map((item) => (item.id === member.id ? data.member : item)));
      setGuestState({
        loading: false,
        message: action === "block" ? "Convidado bloqueado e conteudos arquivados." : "Convidado desbloqueado.",
        tone: "ok"
      });
    } catch (error) {
      setGuestState({ loading: false, message: error instanceof Error ? error.message : "Falha ao alterar convidado.", tone: "error" });
    }
  }

  return (
    <section className="dashboard-settings-grid" aria-label="Configuracoes do evento">
      <article className="settings-form-card">
        <div>
          <span className="pill">Pix do evento</span>
          <h2>Contribuição opcional</h2>
          <p>O responsável informa uma chave Pix para os convidados copiarem. A Praesentia não recebe nem intermedia valores.</p>
        </div>
        <div className="settings-form">
          <label className="settings-switch">
            <input type="checkbox" checked={pixEnabled} onChange={(currentEvent) => setPixEnabled(currentEvent.target.checked)} />
            <span>Ativar Pix no convite</span>
          </label>
          <label className="settings-field">
            Nome do recebedor
            <input value={receiverName} onChange={(currentEvent) => setReceiverName(currentEvent.target.value)} placeholder="Ex: Camila Andrade" />
          </label>
          <label className="settings-field">
            Chave Pix
            <input value={pixKey} onChange={(currentEvent) => setPixKey(currentEvent.target.value)} placeholder="email, CPF, telefone ou chave aleatoria" />
          </label>
          <label className="settings-field">
            Valor sugerido
            <input inputMode="decimal" value={suggestedAmount} onChange={(currentEvent) => setSuggestedAmount(currentEvent.target.value)} placeholder="50" />
          </label>
          <label className="settings-field settings-field-full">
            Mensagem
            <textarea value={pixMessage} onChange={(currentEvent) => setPixMessage(currentEvent.target.value)} placeholder="Contribuicao opcional para a festa." />
          </label>
          <button className="btn settings-primary-action" type="button" disabled={pixState.loading} onClick={submitPix}>
            {pixState.loading ? "Salvando..." : "Salvar Pix"}
          </button>
          <Status state={pixState} />
        </div>
      </article>

      <article className="settings-form-card settings-form-card-dark">
        <div>
          <span className="pill">telão ao vivo</span>
          <h2>Mural em tempo real</h2>
          <p>Controla o que aparece no telão: publicação mais recente no fluxo principal e os três conteúdos mais curtidos ao lado.</p>
        </div>
        <div className="settings-form settings-form-compact">
          <label className="settings-switch"><input type="checkbox" checked={screenEnabled} onChange={(currentEvent) => setScreenEnabled(currentEvent.target.checked)} /><span>Telão ativo</span></label>
          <label className="settings-switch"><input type="checkbox" checked={screenPaused} onChange={(currentEvent) => setScreenPaused(currentEvent.target.checked)} /><span>Pausar atualização</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showQrCode} onChange={(currentEvent) => setShowQrCode(currentEvent.target.checked)} /><span>Mostrar QR Code</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showVideos} onChange={(currentEvent) => setShowVideos(currentEvent.target.checked)} /><span>Mostrar videos</span></label>
          <label className="settings-switch"><input type="checkbox" checked={showMessages} onChange={(currentEvent) => setShowMessages(currentEvent.target.checked)} /><span>Mostrar recados</span></label>
          <button className="btn settings-primary-action" type="button" disabled={screenState.loading} onClick={submitScreen}>
            {screenState.loading ? "Atualizando..." : "Atualizar telão"}
          </button>
          <Status state={screenState} />
        </div>
      </article>

      <article className="settings-form-card">
        <div>
          <span className="pill">privacidade</span>
          <h2>{visibility === "private" ? "Evento privado" : "Evento público"}</h2>
          <p>Todo evento nasce privado. Para publicar, o responsável precisa aceitar os termos e confirmar que entende a mudança de alcance.</p>
        </div>
        <div className="settings-form settings-form-compact">
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

      <article className="settings-form-card">
        <div>
          <span className="pill">convidados</span>
          <h2>Bloqueio e acesso</h2>
          <p>Ao bloquear, o convidado perde acesso e os conteúdos dele ficam arquivados sem visualização até o desbloqueio.</p>
        </div>
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
      </article>
    </section>
  );
}

function Status({ state }: { state: RequestState }) {
  if (!state.message) return null;
  return <p className={`settings-status ${state.tone === "error" ? "is-error" : "is-ok"}`}>{state.message}</p>;
}
