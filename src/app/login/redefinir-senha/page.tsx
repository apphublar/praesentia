import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AppNav } from "@/components/layout/app-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const hasRecoverySession = Boolean(authData.user?.email);

  return (
    <>
      <AppNav />
      <main className="shell" style={{ padding: "48px 0 80px" }}>
        <section className="card login-intro">
          <span className="pill">acesso</span>
          <h1 className="display-i">Nova senha</h1>
          <p>Crie e confirme uma nova senha. Depois de salvar, entre com seu email e a nova senha.</p>
        </section>
        {hasRecoverySession ? (
          <ResetPasswordForm />
        ) : (
          <section className="card auth-form-card">
            <p className="auth-status is-error" style={{ margin: 0 }}>
              Link expirado ou inválido. Peça um novo link à equipe Praesentia.
            </p>
            <Link className="btn btn-secondary" href="/login" style={{ marginTop: 16, display: "inline-flex" }}>
              Ir para o login
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
