import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AppNav } from "@/components/layout/app-nav";

function sanitizeNextParam(value: string | string[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const nextPath = sanitizeNextParam(params.next);

  return (
    <>
      <AppNav />
      <main className="shell" style={{ padding: "48px 0 80px" }}>
        <section className="card login-intro">
          <span className="pill">acesso</span>
          <h1 className="display-i">Nova senha</h1>
          <p>Defina uma nova senha para continuar usando sua conta.</p>
        </section>
        <ResetPasswordForm nextPath={nextPath} />
      </main>
    </>
  );
}
