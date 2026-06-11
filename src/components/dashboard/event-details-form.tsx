"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";

type RequestState = { loading: boolean; message: string; tone: "ok" | "error" | "idle" };

export function EventDetailsForm({ event, needsRsvp }: { event: Event; needsRsvp: boolean }) {
  const [title, setTitle] = useState(event.title);
  const [theme, setTheme] = useState(event.theme);
  const [hostName, setHostName] = useState(event.hostName);
  const [organizerName, setOrganizerName] = useState(event.organizerName ?? "");
  const [date, setDate] = useState(event.date);
  const [startsAt, setStartsAt] = useState(event.startsAt);
  const [endsAt, setEndsAt] = useState(event.endsAt);
  const [venueName, setVenueName] = useState(event.venueName);
  const [venueAddress, setVenueAddress] = useState(event.venueAddress);
  const [venueZip, setVenueZip] = useState(event.venueZip ?? "");
  const [venueComplement, setVenueComplement] = useState(event.venueComplement ?? "");
  const [city, setCity] = useState(event.city);
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState(event.onlineMeetingUrl ?? "");
  const [rsvpEnabled, setRsvpEnabled] = useState(event.rsvpEnabled);
  const [rsvpDeadline, setRsvpDeadline] = useState(event.rsvpDeadline ?? "");
  const [checkInNotes, setCheckInNotes] = useState(event.checkInNotes ?? "");
  const [state, setState] = useState<RequestState>({ loading: false, message: "", tone: "idle" });

  const isOnline = event.eventFormat === "online";

  async function submit() {
    setState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          details: {
            title: title.trim(),
            theme: theme.trim(),
            hostName: hostName.trim(),
            organizerName: organizerName.trim() || undefined,
            date,
            startsAt,
            endsAt,
            venueName: venueName.trim(),
            venueAddress: venueAddress.trim(),
            venueZip: venueZip.trim() || undefined,
            venueComplement: venueComplement.trim() || undefined,
            city: city.trim(),
            onlineMeetingUrl: isOnline ? onlineMeetingUrl.trim() || undefined : undefined,
            rsvpEnabled,
            rsvpDeadline: rsvpDeadline || null,
            checkInNotes: checkInNotes.trim() || null
          }
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Não foi possível salvar."));
      setState({ loading: false, message: "Informações do evento atualizadas.", tone: "ok" });
    } catch (error) {
      setState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar."), tone: "error" });
    }
  }

  return (
    <article className="settings-form-card">
      <div>
        <span className="pill">dados do evento</span>
        <h2>Informações gerais</h2>
        <p>Altere data, horário, local e orientações. As mudanças aparecem no link do convidado imediatamente.</p>
      </div>
      <div className="praesentia-form praesentia-form-grid settings-form">
        <label className="field field-span-full">
          <span>Título</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
        </label>
        <label className="field">
          <span>Tema</span>
          <input value={theme} onChange={(e) => setTheme(e.target.value)} maxLength={160} />
        </label>
        <label className="field">
          <span>Homenageado(a) / responsável</span>
          <input value={hostName} onChange={(e) => setHostName(e.target.value)} maxLength={120} />
        </label>
        <label className="field">
          <span>Organizador(a)</span>
          <input value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} maxLength={120} />
        </label>
        <label className="field">
          <span>Data</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          <span>Início</span>
          <input type="time" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label className="field">
          <span>Término</span>
          <input type="time" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </label>
        {isOnline ? (
          <label className="field field-span-full">
            <span>Link do evento online</span>
            <input value={onlineMeetingUrl} onChange={(e) => setOnlineMeetingUrl(e.target.value)} maxLength={400} />
          </label>
        ) : (
          <>
            <label className="field">
              <span>Local</span>
              <input value={venueName} onChange={(e) => setVenueName(e.target.value)} maxLength={160} />
            </label>
            <label className="field">
              <span>Cidade</span>
              <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={120} />
            </label>
            <label className="field field-span-full">
              <span>Endereço</span>
              <input value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} maxLength={220} />
            </label>
            <label className="field">
              <span>CEP</span>
              <input value={venueZip} onChange={(e) => setVenueZip(e.target.value)} maxLength={12} />
            </label>
            <label className="field">
              <span>Complemento</span>
              <input value={venueComplement} onChange={(e) => setVenueComplement(e.target.value)} maxLength={120} />
            </label>
          </>
        )}
        {needsRsvp ? (
          <>
            <label className="settings-switch field-span-full">
              <input type="checkbox" checked={rsvpEnabled} onChange={(e) => setRsvpEnabled(e.target.checked)} />
              <span>Confirmação de presença ativa</span>
            </label>
            <label className="field">
              <span>Prazo para confirmar</span>
              <input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} />
            </label>
          </>
        ) : null}
        <label className="field field-span-full">
          <span>Orientações para check-in (portaria)</span>
          <textarea
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Ex: Chegar com 15 min de antecedência. Mesas numeradas. Conferir acompanhantes na lista."
          />
          <p className="cover-field-help">Visível para quem opera o check-in no dia do evento.</p>
        </label>
        <button className="btn settings-primary-action" type="button" disabled={state.loading} onClick={submit}>
          {state.loading ? "Salvando..." : "Salvar alterações"}
        </button>
        {state.message ? (
          <p className={`settings-status field-span-full ${state.tone === "error" ? "is-error" : "is-ok"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
    </article>
  );
}
