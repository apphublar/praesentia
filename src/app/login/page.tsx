import { redirect } from "next/navigation";
import { DevLoginForm } from "@/components/auth/dev-login-form";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { SupabaseLoginForm } from "@/components/auth/supabase-login-form";
import { AppNav } from "@/components/layout/app-nav";
import { isPlatformAdmin, getCurrentSession } from "@/lib/auth/session";
import { PLATFORM_ADMIN_EMAIL } from "@/lib/auth/platform-admin";
import { isDevelopmentBypassAllowed } from "@/lib/env";

function sanitizeNextParam(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function loginNotice(error?: string) {
  switch (error) {
    case "account-blocked":
      return "Esta conta está bloqueada. Entre em contato com o suporte.";
    case "profile-pending":
      return "Perfil ainda sendo criado. Aguarde alguns segundos e tente novamente.";
    case "auth-callback":
      return "Não foi possível concluir o login. Tente novamente.";
    case "missing-code":
      return "Link de autenticação inválido ou expirado.";
    case "not-admin":
      return `Acesso ao super admin restrito ao e-mail ${PLATFORM_ADMIN_EMAIL}.`;
    default:
      return null;
  }
}

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const showDevLogin = isDevelopmentBypassAllowed();
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextParam(params.next);
  const initialMfaFactorId = typeof params.factorId === "string" ? params.factorId : undefined;
  const wantsAdmin = nextPath.startsWith("/admin");
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const notice = loginNotice(errorCode);

  const session = await getCurrentSession();
  if (session && !initialMfaFactorId) {
    if (wantsAdmin) {
      if (isPlatformAdmin(session.user)) {
        redirect("/admin");
      }
    } else if (nextPath !== "/login") {
      redirect(nextPath);
    } else if (isPlatformAdmin(session.user)) {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <>
      <AppNav />
      <main className="shell login-page">
        <div className="login-page-grid">
          <div className="login-page-main">
            {wantsAdmin ? (
              <section className="card login-admin-banner">
                <span className="pill">super admin</span>
                <h2 className="display" style={{ fontSize: 22, margin: "10px 0 6px" }}>
                  Acesso ao painel de controle
                </h2>
                <p style={{ margin: 0, lineHeight: 1.55, color: "var(--ink-soft)" }}>
                  Entre com <strong>{PLATFORM_ADMIN_EMAIL}</strong>. Após o login você será enviado para{" "}
                  <strong>/admin</strong>. Se ainda não tem conta, use a aba <strong>Criar conta</strong> com esse
                  e-mail.
                </p>
              </section>
            ) : null}
            <section className="card login-intro">
              <span className="pill">acesso</span>
              <h1 className="display-i">Sua conta Praesentia</h1>
              {showDevLogin ? (
                <p>
                  Ambiente de desenvolvimento com login rápido para testar o fluxo do responsável e do admin.
                </p>
              ) : (
                <p>
                  Entre ou crie sua conta. Recuperação de senha e Google Authenticator disponíveis na aba Entrar.
                </p>
              )}
            </section>
            {notice ? <p className="auth-status is-error login-page-notice">{notice}</p> : null}
            {showDevLogin ? (
              <DevLoginForm />
            ) : (
              <SupabaseLoginForm nextPath={nextPath} initialMfaFactorId={initialMfaFactorId} />
            )}
          </div>
          <LoginShowcase />
        </div>
      </main>
    </>
  );
}
