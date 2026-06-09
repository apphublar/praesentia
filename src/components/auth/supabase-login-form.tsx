"use client";

import { useActionState, useState } from "react";
import {
  loginWithSupabase,
  requestPasswordReset,
  signUpWithSupabase,
  type AuthActionState
} from "@/app/login/actions";
import { PasswordField } from "@/components/auth/password-field";

type AuthMode = "login" | "signup" | "forgot";

const initialState: AuthActionState = {};

export function SupabaseLoginForm({ nextPath }: { nextPath: string }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginState, loginAction, loginPending] = useActionState(loginWithSupabase, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUpWithSupabase, initialState);
  const [forgotState, forgotAction, forgotPending] = useActionState(requestPasswordReset, initialState);
  const activeState = mode === "login" ? loginState : mode === "signup" ? signupState : forgotState;
  const pending = loginPending || signupPending || forgotPending;

  return (
    <section className="card auth-form-card">
      {mode !== "forgot" ? (
        <div className="auth-mode-tabs" role="tablist" aria-label="Modo de autenticação">
          <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => setMode("login")}>
            Entrar
          </button>
          <button type="button" className={mode === "signup" ? "is-active" : ""} onClick={() => setMode("signup")}>
            Criar conta
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="auth-back-link" onClick={() => setMode("login")}>
            ← Voltar para entrar
          </button>
          <h2 className="display" style={{ fontSize: 24, margin: "12px 0 4px" }}>Recuperar senha</h2>
          <p style={{ color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
            Enviaremos um link para redefinir sua senha, se o email estiver cadastrado.
          </p>
        </div>
      )}

      {mode === "login" && (
        <form action={loginAction} className="praesentia-form praesentia-form-stack">
          <input type="hidden" name="next" value={nextPath} />
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <PasswordField name="password" autoComplete="current-password" minLength={6} />
          <button type="button" className="auth-forgot-link" onClick={() => setMode("forgot")}>
            Esqueci minha senha
          </button>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Processando..." : "Entrar"}
          </button>
        </form>
      )}

      {mode === "signup" && (
        <form action={signupAction} className="praesentia-form praesentia-form-stack">
          <input type="hidden" name="next" value={nextPath} />
          <label className="field">
            <span>Nome</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <PasswordField name="password" autoComplete="new-password" minLength={8} />
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Processando..." : "Criar conta"}
          </button>
        </form>
      )}

      {mode === "forgot" && (
        <form action={forgotAction} className="praesentia-form praesentia-form-stack">
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}

      {activeState.error && <p className="auth-status is-error">{activeState.error}</p>}
      {activeState.notice && <p className="auth-status is-ok">{activeState.notice}</p>}
    </section>
  );
}
