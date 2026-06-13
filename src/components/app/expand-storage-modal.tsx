"use client";

import { useState } from "react";
import { Icon } from "@/components/app/ui/icon";
import { Mono } from "@/components/app/ui/primitives";
import {
  EXTRA_STORAGE_PACKAGES_GB,
  getExtraStoragePriceBrl
} from "@/lib/storage/quota";

const VIOLET = "#BBA7E8";

export function ExpandStorageModal({
  totalGb,
  eventId,
  onClose,
  onSuccess
}: {
  totalGb: number;
  eventId: string;
  onClose: () => void;
  onSuccess?: (extraGb: number) => void;
}) {
  const [step, setStep] = useState<"choose" | "pay" | "done">("choose");
  const [sel, setSel] = useState(1);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [doneGb, setDoneGb] = useState(0);

  const options = EXTRA_STORAGE_PACKAGES_GB.map((gb) => ({
    gb,
    price: `R$${getExtraStoragePriceBrl(gb)}`
  }));
  const opt = options[sel] ?? options[0];

  async function pay() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch("/api/billing/add-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, gb: opt.gb })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível ampliar o espaço.");
        setPaying(false);
        return;
      }
      onSuccess?.(opt.gb);
      setDoneGb(opt.gb);
      setStep("done");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(18,14,10,.62)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 30
      }}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop"
        style={{
          width: "min(580px,100%)",
          maxHeight: "90%",
          overflow: "auto",
          background: "var(--dark)",
          border: "1px solid var(--dark-line)",
          borderRadius: 20,
          padding: 28,
          color: "var(--paper)",
          position: "relative",
          boxShadow: "0 40px 90px -30px rgba(0,0,0,.7)"
        }}
        role="dialog"
        aria-labelledby="expand-storage-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          style={{ position: "absolute", top: 18, right: 18, border: "none", background: "transparent", cursor: "pointer", color: "rgba(244,237,223,.5)" }}
        >
          <Icon name="x" size={20} />
        </button>

        {step === "choose" ? (
          <>
            <Mono style={{ color: "var(--amber)" }}>Extras · Cápsula</Mono>
            <h2 id="expand-storage-title" className="serif-i" style={{ fontSize: 28, margin: "8px 0 6px" }}>
              Expanda sua cápsula.
            </h2>
            <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "rgba(244,237,223,.6)" }}>
              Pagamento único, válido durante o período da cápsula. Você tem <strong>{totalGb} GB</strong> hoje.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10 }}>
              {options.map((o, i) => {
                const on = i === sel;
                return (
                  <button
                    key={o.gb}
                    type="button"
                    onClick={() => setSel(i)}
                    style={{
                      cursor: "pointer",
                      padding: "16px 10px",
                      borderRadius: 14,
                      textAlign: "left",
                      background: on ? "#322a22" : "#26201a",
                      border: `1.5px solid ${on ? VIOLET : "var(--dark-line)"}`,
                      transition: "all .14s",
                      boxShadow: on ? "0 0 0 4px rgba(187,167,232,.16)" : "none",
                      color: "inherit"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                      <span className="serif" style={{ fontSize: 26, fontWeight: 600, color: VIOLET }}>
                        +{o.gb}
                      </span>
                      <span className="mono" style={{ color: VIOLET, fontSize: 9 }}>
                        GB
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginTop: 6 }}>{o.price}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 16px", color: "rgba(244,237,223,.5)", fontSize: 11.5 }}>
              <Icon name="lock" size={14} />
              <span>
                Pagamento processado pela <strong style={{ color: "#9b8cf5" }}>Stripe</strong>. O espaço é liberado automaticamente após a confirmação.
              </span>
            </div>
            <button type="button" className="btn btn-amber" style={{ width: "100%" }} onClick={() => setStep("pay")}>
              Continuar para pagamento · {opt.price}
              <Icon name="arrowR" size={15} />
            </button>
          </>
        ) : null}

        {step === "pay" ? (
          <>
            <button
              type="button"
              onClick={() => setStep("choose")}
              style={{
                display: "inline-flex",
                gap: 6,
                alignItems: "center",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "rgba(244,237,223,.6)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                marginBottom: 14,
                padding: 0
              }}
            >
              <Icon name="arrowL" size={15} />
              voltar
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 800, fontSize: 19, color: "#9b8cf5", letterSpacing: "-.02em" }}>
                stripe
              </span>
              <span style={{ display: "inline-flex", gap: 5, alignItems: "center", color: "rgba(244,237,223,.5)", fontSize: 11.5 }}>
                <Icon name="lock" size={13} />
                pagamento seguro
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: 12,
                background: "#26201a",
                border: "1px solid var(--dark-line)",
                marginBottom: 18
              }}
            >
              <span style={{ fontSize: 13.5 }}>
                Cápsula <strong>+{opt.gb} GB</strong>
              </span>
              <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--paper)" }}>
                {opt.price}
              </span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(244,237,223,.65)", lineHeight: 1.5 }}>
              Você será redirecionado ao checkout seguro da Stripe para concluir o pagamento.
            </p>
            <button type="button" className="btn btn-amber" style={{ width: "100%" }} onClick={pay} disabled={paying}>
              {paying ? (
                <>
                  <span
                    className="spin"
                    style={{ width: 16, height: 16, borderRadius: 99, border: "2px solid rgba(58,42,7,.35)", borderTopColor: "#3a2a07" }}
                  />
                  Processando…
                </>
              ) : (
                <>
                  <Icon name="lock" size={15} />
                  Pagar {opt.price}
                </>
              )}
            </button>
            {error ? <p style={{ color: "var(--coral)", fontSize: 13, marginTop: 14 }}>{error}</p> : null}
            <p style={{ textAlign: "center", margin: "12px 0 0", fontSize: 10.5, color: "rgba(244,237,223,.4)" }}>
              Você não será cobrado de novo. Pagamento único processado pela Stripe.
            </p>
          </>
        ) : null}

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "8px 6px" }}>
            <div
              className="pop"
              style={{
                width: 58,
                height: 58,
                borderRadius: 99,
                background: "#5fa56f",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Icon name="check" size={28} sw={2.6} style={{ color: "#fff" }} />
            </div>
            <h2 className="serif-i" style={{ fontSize: 26, marginBottom: 8 }}>
              Pagamento confirmado
            </h2>
            <p style={{ margin: "0 auto 4px", fontSize: 14, color: "rgba(244,237,223,.8)", maxWidth: 340, lineHeight: 1.5 }}>
              Seu espaço foi <strong style={{ color: "var(--amber)" }}>liberado automaticamente</strong>.
            </p>
            <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6, margin: "14px 0 20px" }}>
              <span className="serif" style={{ fontSize: 34, fontWeight: 600, color: "var(--paper)", fontStyle: "italic" }}>
                {totalGb + doneGb} GB
              </span>
              <span className="mono" style={{ color: "rgba(244,237,223,.5)" }}>
                disponíveis
              </span>
            </div>
            <button type="button" className="btn btn-amber" style={{ width: "100%" }} onClick={() => window.location.reload()}>
              Voltar ao painel
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
