import Link from "next/link";
import { AccountActionsPanel } from "@/components/app/account/account-actions-panel";
import { requirePageSession } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await requirePageSession("/dashboard/conta");

  return (
    <div className="account-page">
      <header className="account-page-header">
        <div>
          <h1 className="display" style={{ fontSize: "clamp(28px, 3vw, 36px)", margin: "0 0 8px" }}>
            Conta
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.55, maxWidth: 620 }}>
            Gerencie seus dados de acesso, acompanhe compras e use este espaço para ações importantes da sua conta.
          </p>
        </div>
        <Link className="btn btn-ghost btn-sm" href="/dashboard">
          Voltar aos eventos
        </Link>
      </header>

      <section className="card" style={{ padding: 20 }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: 22 }}>
          Dados da conta
        </h2>
        <p style={{ margin: "0 0 6px" }}>
          <strong>Nome:</strong> {session.user.name}
        </p>
        <p style={{ margin: 0 }}>
          <strong>Email:</strong> {session.user.email}
        </p>
      </section>

      <section className="card" style={{ padding: 20, marginTop: 14 }}>
        <h2 className="display" style={{ marginTop: 0, fontSize: 22 }}>
          Ações importantes
        </h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn btn-ghost btn-sm" href="/dashboard/pagamentos">
            Ver compras
          </Link>
          <Link className="btn btn-ghost btn-sm" href="/login">
            Trocar senha
          </Link>
          <AccountActionsPanel />
        </div>
        <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 12 }}>
          Para trocar a senha, abra o login e use a opção "Esqueci minha senha".
        </p>
      </section>
    </div>
  );
}
