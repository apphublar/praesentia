"use client";

import { useActionState } from "react";
import { updatePasswordAfterRecovery, type AuthActionState } from "@/app/login/actions";
import { PasswordField } from "@/components/auth/password-field";

const initialState: AuthActionState = {};

export function ResetPasswordForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(updatePasswordAfterRecovery, initialState);

  return (
    <section className="card auth-form-card">
      <form action={action} className="praesentia-form praesentia-form-stack">
        <input type="hidden" name="next" value={nextPath} />
        <PasswordField name="password" autoComplete="new-password" minLength={8} />
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
      {state.error && <p className="auth-status is-error">{state.error}</p>}
    </section>
  );
}
