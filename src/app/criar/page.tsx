import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateEventFlow } from "@/app/criar/create-event-flow";
import { AppNav } from "@/components/layout/app-nav";
import { getCurrentSession } from "@/lib/auth/session";

export default async function CreatePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentSession();
  const params = (await searchParams) ?? {};

  if (!session) {
    redirect("/login?next=/criar");
  }

  const error = typeof params.erro === "string" ? params.erro : undefined;
  const errorMessage =
    error === "campos-obrigatorios"
      ? "Preencha todos os campos obrigatórios."
      : error === "link-online-obrigatorio"
        ? "Informe o link do evento online."
        : error === "local-obrigatorio"
          ? "Informe o local completo do evento."
          : null;

  return (
    <>
      <AppNav />
      <main className="shell paper" style={{ padding: "48px 0 90px", maxWidth: 720 }}>
        <span className="pill">criar evento · gratuito</span>
        <h1 className="display-i" style={{ fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.95, margin: "14px 0 12px" }}>
          Vamos criar seu convite
        </h1>
        <p style={{ color: "var(--ink-soft)", marginBottom: 28, lineHeight: 1.6 }}>
          Olá, <strong>{session.user.name.split(" ")[0]}</strong>! Sua conta já está conectada — ao finalizar, o evento vai direto para o seu painel.
        </p>

        {errorMessage && (
          <div className="card" style={{ padding: 16, marginBottom: 20, borderColor: "var(--coral)" }}>
            <p style={{ margin: 0, color: "var(--coral)" }}>{errorMessage}</p>
          </div>
        )}

        <CreateEventFlow />

        <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 28 }}>
          Precisa de outra conta? <Link href="/login?next=/criar" style={{ color: "var(--coral)" }}>Trocar login</Link>
        </p>
      </main>
    </>
  );
}
