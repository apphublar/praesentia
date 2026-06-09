"use client";

import { useActionState, useState } from "react";
import { loginWithSupabase, signUpWithSupabase, type AuthActionState } from "@/app/login/actions";

type AuthMode = "login" | "signup";

const initialState: AuthActionState = {};

export function SupabaseLoginForm({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginState, loginAction, loginPending] = useActionState(loginWithSupabase, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUpWithSupabase, initialState);
  const activeState = mode === "login" ? loginState : signupState;
  const pending = loginPending || signupPending;

  return (
    <section className="card auth-form-card">
      <div className="auth-mode-tabs" role="tablist" aria-label="Modo de autenticacao">
        <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
          Entrar
        </button>
        <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
          Criar conta
        </button>
      </div>

      <form action={mode === "login" ? loginAction : signupAction} className="praesentia-form praesentia-form-stack">
        <input type="hidden" name="next" value={nextPath} />
        {mode === "signup" && (
          <label className="field">
            <span>Nome</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </label>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Processando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      {activeState.error && <p className="auth-status is-error">{activeState.error}</p>}
      {activeState.notice && <p className="auth-status is-ok">{activeState.notice}</p>}
    </section>
  );
}
