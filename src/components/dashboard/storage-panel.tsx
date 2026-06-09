"use client";

import { useState } from "react";
import {
  EXTRA_STORAGE_PACKAGES_GB,
  getExtraStoragePriceBrl,
  type StorageSnapshot
} from "@/lib/storage/quota";

export function StoragePanel({ eventId, snapshot }: { eventId: string; snapshot: StorageSnapshot }) {
  const [loadingGb, setLoadingGb] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [extraGb, setExtraGb] = useState(snapshot.extraGb);

  async function buyStorage(gb: number) {
    setLoadingGb(gb);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/billing/add-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, gb })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível expandir o armazenamento.");
        return;
      }
      setExtraGb(data.extraStorageGb ?? extraGb + gb);
      setMessage(data.message ?? `+${gb} GB liberados.`);
      window.location.reload();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingGb(null);
    }
  }

  const contractedGb = snapshot.contractedGb;
  const usedLabel = snapshot.usedGb.toFixed(2);
  const contractedLabel = contractedGb.toFixed(0);

  return (
    <article className="card" style={{ padding: 22 }}>
      <span className="pill">armazenamento</span>
      <h2 className="display" style={{ fontSize: 30, margin: "12px 0" }}>
        {usedLabel} GB usados
      </h2>
      <div style={{ height: 10, borderRadius: 999, background: "var(--bg-soft)", overflow: "hidden" }}>
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${snapshot.progressPercent}%`,
            background: snapshot.progressPercent >= 90 ? "var(--coral)" : "var(--green)",
            borderRadius: 999
          }}
        />
      </div>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 12 }}>
        {snapshot.isSharedPool ? (
          <>
            Cápsula Plus: <strong>{usedLabel} / {contractedLabel} GB</strong> no total (até 6 eventos compartilham este espaço).
            {snapshot.eventUsedGb > 0 && (
              <> Este evento usa <strong>{snapshot.eventUsedGb.toFixed(2)} GB</strong>.</>
            )}
          </>
        ) : (
          <>
            Cápsula: <strong>{usedLabel} / {contractedLabel} GB</strong> neste evento.
          </>
        )}
        {extraGb > 0 && <> Inclui <strong>+{extraGb.toFixed(0)} GB</strong> extras contratados.</>}
      </p>

      <div className="storage-actions-row" style={{ marginTop: 16 }}>
        {EXTRA_STORAGE_PACKAGES_GB.map((gb) => (
          <button
            key={gb}
            type="button"
            className="btn secondary"
            disabled={loadingGb !== null}
            onClick={() => buyStorage(gb)}
          >
            {loadingGb === gb ? "Processando..." : `+${gb} GB · R$${getExtraStoragePriceBrl(gb)}`}
          </button>
        ))}
      </div>

      {message && <p style={{ color: "var(--green)", marginTop: 12, fontWeight: 700 }}>{message}</p>}
      {error && <p style={{ color: "var(--coral)", marginTop: 12, fontWeight: 700 }}>{error}</p>}
    </article>
  );
}
