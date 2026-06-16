import { AdminMetricsGrid } from "@/components/platform-admin/admin-metrics-grid";
import { ADMIN_EXTERNAL_LINKS } from "@/lib/admin/constants";
import { adminRepository } from "@/lib/db";

export default async function AdminOverviewPage() {
  const metrics = await adminRepository.getMetrics();

  return (
    <>
      <section className="platform-admin-section">
        <h2>Visão geral</h2>
        <p className="platform-admin-lead">
          Métricas consolidadas da plataforma — clientes, faturamento, planos, convites, visitantes e custos de IA.
        </p>
        <AdminMetricsGrid metrics={metrics} />
      </section>

      <section className="platform-admin-section platform-admin-links">
        <h3>Acesso rápido</h3>
        <div className="platform-admin-link-row">
          <a href={ADMIN_EXTERNAL_LINKS.stripeDashboard} target="_blank" rel="noreferrer">Stripe · pagamentos</a>
          <a href={ADMIN_EXTERNAL_LINKS.openAiUsage} target="_blank" rel="noreferrer">OpenAI · uso e custos</a>
          <a href={ADMIN_EXTERNAL_LINKS.openAiApiKeys} target="_blank" rel="noreferrer">OpenAI · chaves API</a>
          <a href={ADMIN_EXTERNAL_LINKS.supabaseDashboard} target="_blank" rel="noreferrer">Supabase · banco e auth</a>
        </div>
      </section>

      <section className="card platform-admin-note">
        <h3>Observações</h3>
        <ul>
          <li>Interações de visitantes contam RSVPs confirmados e pendentes registrados na plataforma.</li>
          <li>Custo de IA é estimado com base nos contadores de geração — confira valores reais no painel OpenAI.</li>
          <li>Pagamentos em modo teste (devMode) não entram no faturamento total.</li>
          <li>Execute a migration <code>014-admin-panel.sql</code> no Supabase para bloqueio de contas e notas internas.</li>
        </ul>
      </section>
    </>
  );
}
