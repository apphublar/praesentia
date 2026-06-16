"use client";

import { useState } from "react";

type LoginRole = "owner" | "admin";

const options: Record<LoginRole, { email: string; label: string; description: string; redirectTo: string }> = {
  owner: {
    email: "camila@example.com",
    label: "Entrar como responsável",
    description: "Acessa eventos, criação, dashboard, Pix e controles do evento.",
    redirectTo: "/dashboard"
  },
  admin: {
    email: "adm.praesentia@gmail.com",
    label: "Entrar como admin",
    description: "Acessa a operação da plataforma e controles globais.",
    redirectTo: "/admin"
  }
};

export function DevLoginForm() {
  const [pending, setPending] = useState<LoginRole | null>(null);
  const [error, setError] = useState("");

  async function login(role: LoginRole) {
    setPending(role);
    setError("");

    const option = options[role];
    const response = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: option.email, reauth: true })
    });

    if (!response.ok) {
      setPending(null);
      setError("Não foi possível entrar. Tente novamente.");
      return;
    }

    window.location.href = option.redirectTo;
  }

  return (
    <div className="dev-login-actions">
      {(Object.keys(options) as LoginRole[]).map((role) => {
        const option = options[role];
        return (
          <article key={role} className="card">
            <div>
              <h2 className="display">{option.label}</h2>
              <p>{option.description}</p>
            </div>
            <button className="btn" type="button" onClick={() => login(role)} disabled={pending !== null}>
              {pending === role ? "Entrando..." : option.label}
            </button>
          </article>
        );
      })}
      {error && <p className="dev-login-error">{error}</p>}
    </div>
  );
}
