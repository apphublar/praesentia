"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[praesentia] dashboard error", error);
  }, [error]);

  return (
    <main className="shell paper dashboard-main" style={{ padding: "80px 0", textAlign: "center" }}>
      <span className="pill">painel</span>
      <h1 className="display-i" style={{ fontSize: "clamp(36px, 6vw, 64px)", margin: "16px 0 12px" }}>
        Não foi possível carregar esta página
      </h1>
      <p style={{ color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: 520, margin: "0 auto 28px" }}>
        Algo deu errado ao abrir o painel. Tente recarregar.
        {error.message ? (
          <>
            {" "}
            Detalhe técnico: <code>{error.message}</code>
          </>
        ) : null}
        {error.digest ? (
          <>
            {" "}
            Código: <code>{error.digest}</code>
          </>
        ) : null}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => reset()}>
          Recarregar
        </button>
        <Link className="btn secondary" href="/dashboard">
          Ir para meus eventos
        </Link>
        <Link className="btn secondary" href="/login">
          Entrar novamente
        </Link>
      </div>
    </main>
  );
}
