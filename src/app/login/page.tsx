import { DevLoginForm } from "@/components/auth/dev-login-form";
import { LoginShowcase } from "@/components/auth/login-showcase";
import { SupabaseLoginForm } from "@/components/auth/supabase-login-form";
import { AppNav } from "@/components/layout/app-nav";
import { isDevelopmentBypassAllowed } from "@/lib/env";

function sanitizeNextParam(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
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
                  Entre ou crie sua conta. Recuperação de senha e Google Authenticator disponíveis na aba Entrar.
                </p>
              )}
            </section>
            {showDevLogin ? <DevLoginForm /> : <SupabaseLoginForm nextPath={nextPath} initialMfaFactorId={initialMfaFactorId} />}
          </div>
          <LoginShowcase />
        </div>
      </main>
    </>
  );
}
