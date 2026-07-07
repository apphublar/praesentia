import { redirect } from "next/navigation";
import { DevLoginForm } from "@/components/auth/dev-login-form";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { SupabaseLoginForm } from "@/components/auth/supabase-login-form";
import { AppNav } from "@/components/layout/app-nav";
import { loginRequiresMfaVerification } from "@/lib/auth/mfa";
import { isPlatformAdmin, getCurrentSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDevelopmentBypassAllowed } from "@/lib/env";

function sanitizeNextParam(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

function loginNotice(error?: string, success?: string) {
  if (success === "password-updated") {
    return {
      text: "Senha atualizada com sucesso. Entre com seu email e a nova senha.",
      tone: "success" as const
    };
  }

  switch (error) {
    case "account-blocked":
      return { text: "Esta conta está bloqueada. Entre em contato com o suporte.", tone: "error" as const };
    case "profile-pending":
      return { text: "Perfil ainda sendo criado. Aguarde alguns segundos e tente novamente.", tone: "error" as const };
    case "auth-callback":
      return { text: "Não foi possível concluir o login. Tente novamente.", tone: "error" as const };
    case "missing-code":
      return { text: "Link de autenticação inválido ou expirado.", tone: "error" as const };
    case "not-admin":
      return { text: "Acesso restrito. Entre com uma conta autorizada.", tone: "error" as const };
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
  const noticeCode = typeof params.notice === "string" ? params.notice : undefined;
  const notice = loginNotice(errorCode, noticeCode);

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

  if (!session && !showDevLogin && !initialMfaFactorId) {
    const supabase = await createSupabaseServerClient();
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;

    if (authUser?.email) {
      const mfa = await loginRequiresMfaVerification(supabase);
      if (!mfa.required) {
        redirect(`/api/auth/establish-session?next=${encodeURIComponent(nextPath)}`);
      }
    }
  }

  return (
    <>
      <AppNav />
      <main className="shell login-page">
        <div className="login-page-grid">
          <div className="login-page-main">
            <section className="card login-intro">
              <span className="pill">acesso</span>
              <h1 className="display-i">Sua conta Praesentia</h1>
              {showDevLogin ? (
                <p>
                  Ambiente de desenvolvimento com login rápido para testar o fluxo do responsável e do admin.
                </p>
              ) : (
                <p>
                  Entre com seu email ou crie sua conta para montar convites, acompanhar confirmações e gerenciar seus
                  eventos em um só lugar.
                </p>
              )}
            </section>
            {notice ? (
              <p className={`auth-status login-page-notice${notice.tone === "success" ? " is-ok" : " is-error"}`}>{notice.text}</p>
            ) : null}
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
