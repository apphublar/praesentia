import { DevLoginForm } from "@/components/auth/dev-login-form";
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

  return (
    <>
      <AppNav />
      <main className="shell" style={{ padding: "48px 0 80px" }}>
        <section className="card login-intro">
          <span className="pill">acesso</span>
          <h1 className="display-i">Login da Praesentia</h1>
          {showDevLogin ? (
            <p>
              Este ambiente esta com login de desenvolvimento habilitado explicitamente para testar o fluxo do responsavel e do admin.
            </p>
          ) : (
            <p>
              Entre com uma conta Supabase Auth para acessar dashboard, administracao e criacao de eventos.
            </p>
          )}
        </section>
        {showDevLogin ? <DevLoginForm /> : <SupabaseLoginForm nextPath={nextPath} />}
      </main>
    </>
  );
}
