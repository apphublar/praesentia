"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { ConfBlock, ConfigRow, Field2 } from "@/components/app/admin/conf-block";
import { Segmented } from "@/components/app/ui/primitives";
import { apiErrorMessage, dashboardFetchJson } from "@/lib/api/dashboard-fetch";

type RequestState = { loading: boolean; message: string; tone: "ok" | "error" | "idle" };
const idle: RequestState = { loading: false, message: "", tone: "idle" };

function Status({ state }: { state: RequestState }) {
  if (state.tone === "idle" || !state.message) return null;
  return (
    <p style={{ margin: "8px 0 0", fontSize: 12.5, color: state.tone === "ok" ? "var(--ink-2)" : "var(--coral-deep)" }}>
      {state.message}
    </p>
  );
}

export function AdminScreenSettings({ event }: { event: Event }) {
  const [screenRefresh, setScreenRefresh] = useState<"Tempo real" | "A cada 30s" | "Curadoria">(
    event.screen.paused ? "Curadoria" : "Tempo real"
  );
  const [screenEnabled, setScreenEnabled] = useState(event.screen.enabled);
  const [showMessages, setShowMessages] = useState(event.screen.showMessages);
  const [showVideos, setShowVideos] = useState(event.screen.showVideos);
  const [showQrCode, setShowQrCode] = useState(event.screen.showQrCode);
  const [screenState, setScreenState] = useState<RequestState>(idle);

  async function saveScreen() {
    setScreenState({ loading: true, message: "", tone: "idle" });
    try {
      const { response, data } = await dashboardFetchJson(`/api/events/${event.id}/screen`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: screenEnabled,
          paused: screenRefresh === "Curadoria",
          showQrCode,
          showVideos,
          showMessages
        })
      });
      if (!response.ok) throw new Error(String(data.error ?? "Erro ao salvar."));
      setScreenState({ loading: false, message: "Configurações do telão salvas.", tone: "ok" });
    } catch (error) {
      setScreenState({ loading: false, message: apiErrorMessage(error, "Falha ao salvar."), tone: "error" });
    }
  }

  return (
    <ConfBlock title="Telão & mural" desc="Como os momentos aparecem na festa e no telão.">
      <Field2 label="Atualização do telão">
        <Segmented
          options={[
            { v: "Tempo real" as const, l: "Tempo real" },
            { v: "A cada 30s" as const, l: "A cada 30s" },
            { v: "Curadoria" as const, l: "Curadoria" }
          ]}
          value={screenRefresh}
          onChange={setScreenRefresh}
        />
      </Field2>
      <ConfigRow label="Telão ativo" on={screenEnabled} onChange={setScreenEnabled} />
      <ConfigRow label="Recados no telão" on={showMessages} onChange={setShowMessages} />
      <ConfigRow label="Vídeos no telão" on={showVideos} onChange={setShowVideos} />
      <ConfigRow label="QR code no telão" on={showQrCode} onChange={setShowQrCode} />
      <button type="button" className="btn btn-dark btn-sm" disabled={screenState.loading} onClick={saveScreen}>
        {screenState.loading ? "Salvando…" : "Salvar configurações"}
      </button>
      <Status state={screenState} />
    </ConfBlock>
  );
}
