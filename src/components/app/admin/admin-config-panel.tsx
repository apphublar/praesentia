"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Event, EventMember } from "@/types/domain";
import { ConfBlock, ConfigRow, Field2 } from "@/components/app/admin/conf-block";
import { GiftSuggestionsAdminEditor } from "@/components/app/admin/gift-suggestions-admin-editor";
import type { GiftSuggestion } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";

type RequestState = { loading: boolean; message: string; tone: "ok" | "error" | "idle" };
const idle: RequestState = { loading: false, message: "", tone: "idle" };

export function AdminConfigPanel({
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
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [startsAt, setStartsAt] = useState(event.startsAt);
  const [endsAt, setEndsAt] = useState(event.endsAt);
  const [rsvpDeadline, setRsvpDeadline] = useState(event.rsvpDeadline ?? "");
  const [checkInNotes, setCheckInNotes] = useState(event.checkInNotes ?? "");
  const [askCompanions, setAskCompanions] = useState(true);
  const [allowMessageOnRsvp, setAllowMessageOnRsvp] = useState(true);
  const [detailsState, setDetailsState] = useState<RequestState>(idle);

  const [pixEnabled, setPixEnabled] = useState(Boolean(event.pix?.enabled));
  const [pixKey, setPixKey] = useState(event.pix?.key ?? "");
  const [pixState, setPixState] = useState<RequestState>(idle);
  const [giftState, setGiftState] = useState<RequestState>(idle);
  const [localMembers, setLocalMembers] = useState(members);

  const ownerCount = useMemo(() => members.filter((m) => m.role === "owner").length, [members]);

  async function saveDetails() {
    setDetailsState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          details: {
            title: title.trim(),
            date,
            startsAt,
            endsAt,
            rsvpEnabled: needsRsvp,
            rsvpDeadline: rsvpDeadline || null,
            checkInNotes: checkInNotes.trim() || null
          }
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar."));
      setDetailsState({ loading: false, message: "Configurações salvas.", tone: "ok" });
    } catch (error) {
      setDetailsState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar."), tone: "error" });
    }
  }

  async function saveGiftSuggestions(items: GiftSuggestion[]) {
    setGiftState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({ giftSuggestions: items })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar."));
      setGiftState({ loading: false, message: "Sugestões salvas.", tone: "ok" });
    } catch (error) {
      setGiftState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar sugestões."), tone: "error" });
    }
  }

  async function savePix() {
    setPixState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          pix: {
            enabled: pixEnabled,
            receiverName: event.pix?.receiverName ?? event.hostName,
            key: pixKey,
            suggestedAmount: event.pix?.suggestedAmount,
            message: event.pix?.message ?? ""
          }
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar."));
      setPixState({ loading: false, message: "Pix atualizado.", tone: "ok" });
    } catch (error) {
      setPixState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar Pix."), tone: "error" });
    }
  }


  return (
    <div className="admin-config-panel">
      <ConfBlock title="Confirmação de presença" desc="Defina o prazo e o que pedir aos convidados.">
        <Field2 label="Prazo do RSVP">
          <input type="date" className="input" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
        </Field2>
        <ConfigRow label="Pedir nome dos acompanhantes" on={askCompanions} onChange={setAskCompanions} />
        <ConfigRow label="Permitir recado no RSVP" on={allowMessageOnRsvp} onChange={setAllowMessageOnRsvp} />
        <button type="button" className="btn btn-dark btn-sm" disabled={detailsState.loading} onClick={saveDetails}>
          {detailsState.loading ? "Salvando…" : "Salvar RSVP"}
        </button>
        <Status state={detailsState} />
      </ConfBlock>

      <ConfBlock title="Pix" desc="Opcional. Aparece na página do convite.">
        <ConfigRow label="Mostrar Pix no convite" on={pixEnabled} onChange={setPixEnabled} />
        <Field2 label="Chave Pix">
          <input className="input" placeholder="email, telefone ou aleatória" value={pixKey} onChange={(e) => setPixKey(e.target.value)} />
        </Field2>
        <button type="button" className="btn btn-dark btn-sm" disabled={pixState.loading} onClick={savePix}>
          {pixState.loading ? "Salvando…" : "Salvar Pix"}
        </button>
        <Status state={pixState} />
      </ConfBlock>

      <ConfBlock title="Sugestões de presente" desc="Ideias de presente em carrossel na página do convite.">
        <GiftSuggestionsAdminEditor
          initialItems={event.giftSuggestions}
          onSave={saveGiftSuggestions}
          saving={giftState.loading}
          message={giftState.message}
          tone={giftState.tone}
        />
      </ConfBlock>

      {capsuleActive ? (
        <ConfBlock title="Telão & mural" desc="Projeção na festa e atualização do telão.">
          <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>
            Configure o telão, QR code e o que aparece na projeção na tela dedicada.
          </p>
          <Link className="btn btn-dark btn-sm" href={`/dashboard/eventos/${event.id}/telao`}>
            Configurar telão
          </Link>
        </ConfBlock>
      ) : null}

      <ConfBlock title="Orientações para a portaria" desc="Texto que aparece no link de check-in.">
        <Field2 label="Instruções">
          <textarea className="input" rows={2} value={checkInNotes} onChange={(e) => setCheckInNotes(e.target.value)} placeholder="Recepção a partir das 15h30…" />
        </Field2>
        <Field2 label="Título do evento">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field2>
        <div className="admin-config-datetime">
          <Field2 label="Data">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field2>
          <Field2 label="Início">
            <input type="time" className="input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </Field2>
          <Field2 label="Fim">
            <input type="time" className="input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </Field2>
        </div>
        <button type="button" className="btn btn-dark btn-sm" disabled={detailsState.loading} onClick={saveDetails}>
          {detailsState.loading ? "Salvando…" : "Salvar orientações"}
        </button>
        <Status state={detailsState} />
      </ConfBlock>

      {capsuleActive && localMembers.length > 0 ? (
        <ConfBlock title="Moderar convidados" desc="Bloqueie acesso ao mural quando necessário.">
          {localMembers.map((member) => {
            const blocked = member.accessStatus === "blocked";
            const isOnlyOwner = member.role === "owner" && ownerCount <= 1;
            return (
              <div key={member.id} className="admin-member-row">
                <span className="admin-member-id">{member.userId}</span>
                <button
                  type="button"
                  className={`btn btn-sm ${blocked ? "btn-coral" : "btn-ghost"}`}
                  disabled={isOnlyOwner}
                  onClick={async () => {
                    const { response, data } = await dashboardFetchJson(
                      `/api/events/${event.id}/members/${member.userId}`,
                      {
                        method: "PATCH",
                        body: JSON.stringify({ action: blocked ? "unblock" : "block" })
                      }
                    );
                    const updatedMember = data.member as EventMember | undefined;
                    if (response.ok && updatedMember) {
                      setLocalMembers((current) =>
                        current.map((row) => (row.userId === member.userId ? updatedMember : row))
                      );
                    }
                  }}
                >
                  {blocked ? "Desbloquear" : "Bloquear"}
                </button>
              </div>
            );
          })}
        </ConfBlock>
      ) : null}
    </div>
  );
}

function Status({ state }: { state: RequestState }) {
  if (!state.message) return null;
  return (
    <p style={{ margin: 0, fontSize: 13, color: state.tone === "error" ? "var(--coral-deep)" : "#7d9a6f" }}>{state.message}</p>
  );
}
