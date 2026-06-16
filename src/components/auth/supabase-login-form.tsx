"use client";

import { useActionState, useEffect, useState } from "react";
import {
  confirmMfaEnrollment,
  loginWithSupabase,
  requestPasswordReset,
  signUpWithSupabase,
  startMfaEnrollment,
  verifyLoginMfa,
  type AuthActionState
} from "@/app/login/actions";
import { PasswordField } from "@/components/auth/password-field";

type AuthMode = "login" | "signup" | "forgot" | "mfa";

const initialState: AuthActionState = {};

export function SupabaseLoginForm({
  nextPath,
  initialMfaFactorId
}: {
  nextPath: string;
  initialMfaFactorId?: string;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMfaFactorId ? "mfa" : "login");
  const [factorId, setFactorId] = useState(initialMfaFactorId ?? "");
  const [pendingNext, setPendingNext] = useState(nextPath);

  const [loginState, loginAction, loginPending] = useActionState(loginWithSupabase, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signUpWithSupabase, initialState);
  const [forgotState, forgotAction, forgotPending] = useActionState(requestPasswordReset, initialState);
  const [mfaState, mfaAction, mfaPending] = useActionState(verifyLoginMfa, initialState);

  const activeState = mode === "login" ? loginState : mode === "signup" ? signupState : mode === "forgot" ? forgotState : mfaState;
  const pending = loginPending || signupPending || forgotPending || mfaPending;

  useEffect(() => {
    if (loginState.requiresMfa && loginState.factorId) {
      setMode("mfa");
      setFactorId(loginState.factorId);
      setPendingNext(loginState.pendingNext ?? nextPath);
    }
  }, [loginState, nextPath]);

  return (
    <section className="card auth-form-card">
      {mode === "mfa" ? (
        <div>
          <button type="button" className="auth-back-link" onClick={() => setMode("login")}>
            ← Voltar para entrar
          </button>
          <h2 className="display" style={{ fontSize: 24, margin: "12px 0 4px" }}>Google Authenticator</h2>
          <p style={{ color: "var(--ink-soft)", margin: 0, lineHeight: 1.55 }}>
            Digite o código de 6 dígitos exibido no seu app autenticador.
          </p>
        </div>
      ) : mode !== "forgot" ? (
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
        <>
          <form action={loginAction} className="praesentia-form praesentia-form-stack">
            <input type="hidden" name="next" value={nextPath} />
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <PasswordField name="password" autoComplete="current-password" minLength={6} />
            <button className="btn" type="submit" disabled={pending}>
              {pending ? "Processando..." : "Entrar"}
            </button>
          </form>
          <div className="auth-secondary-actions">
            <button type="button" className="auth-forgot-link" onClick={() => setMode("forgot")}>
              Esqueci minha senha
            </button>
          </div>
        </>
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

      {mode === "mfa" && (
        <form action={mfaAction} className="praesentia-form praesentia-form-stack">
          <input type="hidden" name="factorId" value={factorId} />
          <input type="hidden" name="next" value={pendingNext} />
          <label className="field">
            <span>Código do autenticador</span>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
            />
          </label>
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Verificando..." : "Confirmar e entrar"}
          </button>
        </form>
      )}

      {activeState.error && <p className="auth-status is-error">{activeState.error}</p>}
      {activeState.notice && <p className="auth-status is-ok">{activeState.notice}</p>}
    </section>
  );
}

export function AdminMfaSetupPanel({ enrolled }: { enrolled: boolean }) {
  const [enrollState, setEnrollState] = useState<AuthActionState>({});
  const [confirmState, confirmAction, confirmPending] = useActionState(confirmMfaEnrollment, initialState);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    const result = await startMfaEnrollment();
    setEnrollState(result);
    setLoading(false);
  }

  return (
    <section className="card">
      <h2>Google Authenticator</h2>
      <p className="platform-admin-lead">
        {enrolled
          ? "Autenticador ativo. Ao entrar, você precisará do código de 6 dígitos."
          : "Configure o autenticador para proteger o acesso ao super admin."}
      </p>

      {enrolled ? (
        <p className="platform-admin-notice">✓ Autenticador configurado</p>
      ) : (
        <>
          {!enrollState.mfaQrCode ? (
            <button className="btn" type="button" onClick={handleStart} disabled={loading}>
              {loading ? "Gerando QR Code..." : "Configurar Google Authenticator"}
            </button>
          ) : (
            <form action={confirmAction} className="platform-admin-form">
              <input type="hidden" name="factorId" value={enrollState.mfaFactorId ?? ""} />
              {enrollState.mfaQrCode ? (
                <div className="auth-mfa-qr-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={enrollState.mfaQrCode} alt="QR Code do Google Authenticator" width={200} height={200} />
                </div>
              ) : null}
              <label>
                Código de confirmação
                <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
              </label>
              <button className="btn" type="submit" disabled={confirmPending}>
                {confirmPending ? "Confirmando..." : "Ativar autenticador"}
              </button>
            </form>
          )}
        </>
      )}

      {enrollState.error && <p className="platform-admin-error">{enrollState.error}</p>}
      {enrollState.notice && !enrollState.mfaQrCode && <p className="platform-admin-notice">{enrollState.notice}</p>}
      {confirmState.error && <p className="platform-admin-error">{confirmState.error}</p>}
      {confirmState.notice && <p className="platform-admin-notice">{confirmState.notice}</p>}
    </section>
  );
}
