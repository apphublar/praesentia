"use client";

import { useActionState } from "react";
import { adminUpdateEmail, adminUpdatePassword, type AdminActionState } from "@/app/admin/actions";
import type { User } from "@/types/domain";

const initial: AdminActionState = {};

export function AdminSettingsPanel({ user }: { user: User }) {
  const [passwordState, passwordAction, passwordPending] = useActionState(adminUpdatePassword, initial);
  const [emailState, emailAction, emailPending] = useActionState(adminUpdateEmail, initial);

  return (
    <>
      <section className="card">
        <h2>Sua conta admin</h2>
        <p>E-mail atual: <strong>{user.email}</strong></p>
      </section>

      <section className="card">
        <h2>Alterar senha</h2>
        <form action={passwordAction} className="platform-admin-form">
          <label>
            Senha atual
            <input type="password" name="currentPassword" required autoComplete="current-password" />
          </label>
          <label>
            Nova senha
            <input type="password" name="newPassword" required minLength={8} autoComplete="new-password" />
          </label>
          <label>
            Confirmar nova senha
            <input type="password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
          </label>
          <button className="btn" type="submit" disabled={passwordPending}>
            {passwordPending ? "Salvando..." : "Atualizar senha"}
          </button>
          {passwordState.message ? <p className="platform-admin-notice">{passwordState.message}</p> : null}
          {passwordState.error ? <p className="platform-admin-error">{passwordState.error}</p> : null}
        </form>
      </section>

      <section className="card">
        <h2>Alterar e-mail</h2>
        <form action={emailAction} className="platform-admin-form">
          <label>
            Novo e-mail
            <input type="email" name="email" required defaultValue={user.email} autoComplete="email" />
          </label>
          <label>
            Senha atual (confirmação)
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
          <button className="btn" type="submit" disabled={emailPending}>
            {emailPending ? "Salvando..." : "Atualizar e-mail"}
          </button>
          {emailState.message ? <p className="platform-admin-notice">{emailState.message}</p> : null}
          {emailState.error ? <p className="platform-admin-error">{emailState.error}</p> : null}
        </form>
      </section>
    </>
  );
}
