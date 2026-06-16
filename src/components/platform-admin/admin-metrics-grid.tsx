import { formatBrl, formatUsd } from "@/lib/admin/constants";
import type { AdminMetrics } from "@/lib/db/admin-types";
import { AdminStatCard } from "@/components/platform-admin/admin-stat-card";

export function AdminMetricsGrid({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="platform-admin-metrics">
      <AdminStatCard label="Total de clientes" value={metrics.totalClients} hint="Contas de responsáveis" />
      <AdminStatCard label="Faturamento" value={formatBrl(metrics.totalRevenueBrl)} hint="Pagamentos confirmados" accent="var(--coral-deep)" />
      <AdminStatCard label="Plano gratuito" value={metrics.freePlanClients} hint="Sem cápsula ou Plus ativo" />
      <AdminStatCard label="Plano pago" value={metrics.paidPlanClients} hint="Cápsula ou Plus em uso" />
      <AdminStatCard label="Eventos criados" value={metrics.totalEvents} />
      <AdminStatCard label="Cápsulas ativas" value={metrics.activeCapsuleEvents} />
      <AdminStatCard label="Convites gerados (IA)" value={metrics.totalInvitesGenerated} hint="Capa + textos" />
      <AdminStatCard label="Imagem própria" value={metrics.customImageInvites} hint="Clientes com upload manual" />
      <AdminStatCard label="Interações visitantes" value={metrics.visitorInteractions} hint="RSVPs registrados" />
      <AdminStatCard label="Compras de GB" value={metrics.storagePurchases} />
      <AdminStatCard label="Pacotes criativos" value={metrics.aiInvitePlanPurchases} />
      <AdminStatCard label="Pacotes capa IA" value={metrics.aiCoverPackPurchases} />
      <AdminStatCard
        label="Custo IA estimado"
        value={formatUsd(metrics.estimatedAiCostUsd)}
        hint={`${metrics.aiArtifactsCompleted} concluídas · ${metrics.aiArtifactsRefunded} estornadas`}
        accent="#2563eb"
      />
    </div>
  );
}
