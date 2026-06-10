import Link from "next/link";
import { CreateEventFlow } from "@/app/criar/create-event-flow";
import { requirePageSession } from "@/lib/auth/session";

function resolveCreateError(error: string | undefined) {
  if (error === "campos-obrigatorios") return "Preencha todos os campos obrigatórios.";
  if (error === "link-online-obrigatorio") return "Informe o link do evento online.";
  if (error === "local-obrigatorio") return "Informe o local completo do evento.";
  if (error === "pix-obrigatorio") return "Informe uma chave Pix válida para a vaquinha.";
  return null;
}

export default async function DashboardCreatePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePageSession("/dashboard/criar");
  const params = (await searchParams) ?? {};
  const error = typeof params.erro === "string" ? params.erro : undefined;
  const errorMessage = resolveCreateError(error);

  return (
    <main className="dashboard-main">
      <section className="dashboard-page-header">
        <p className="dashboard-event-greeting">Olá, {session.user.name.split(" ")[0]}</p>
        <h1 className="display-i dashboard-page-title">Criar novo evento</h1>
        <p className="dashboard-page-lead">
          Preencha as informações abaixo. Ao finalizar, o evento vai direto para o seu painel.
        </p>
      </section>

      {errorMessage ? (
        <div className="card dashboard-card" style={{ padding: 16, marginBottom: 20, borderColor: "var(--coral)" }}>
          <p style={{ margin: 0, color: "var(--coral)" }}>{errorMessage}</p>
        </div>
      ) : null}

      <section className="card dashboard-card" style={{ padding: 24, maxWidth: 720 }}>
        <CreateEventFlow />
      </section>

      <p style={{ color: "var(--ink-soft)", fontSize: 13, marginTop: 20 }}>
        Precisa de outra conta?{" "}
        <Link href="/login?next=/dashboard/criar" style={{ color: "var(--coral)" }}>
          Trocar login
        </Link>
      </p>
    </main>
  );
}
